import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css'; 
import { createClient } from '@supabase/supabase-js'; 

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

const customModalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '600px', height: '85%',
    borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column'
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000 }
};

Modal.setAppElement('#root');

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("search"); 
  const [query, setQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState([]); 
  const [allReviews, setAllReviews] = useState([]); 

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); // [NEW] 읽기 전용 모드
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isPublic, setIsPublic] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // 로그인 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
  };
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("가입 실패: " + error.message);
    else alert("가입 메일 확인!");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAllReviews([]);
  };

  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await fetch(`${API_URL}/api/Search/${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) { alert("검색 실패!"); }
  };

  const fetchReviews = async () => {
    const myId = session?.user?.id || "";
    try {
      const response = await fetch(`${API_URL}/api/Review?userId=${myId}`);
      const data = await response.json();
      setAllReviews(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (activeTab === "public_library" || activeTab === "my_library") {
      fetchReviews();
    }
  }, [activeTab, session]);

  // [기록하기] 버튼 클릭 시 (새 글 작성)
  const openWriteModal = (item) => {
    setIsEditMode(false);
    setIsReadOnly(false); // 쓰기 모드
    setSelectedItem(item);
    setEditorContent(""); 
    setRating(5); 
    setIsPublic(true);
    setIsModalOpen(true);
  };

  // [카드 클릭 시] (상세 보기 or 수정)
  const openDetailModal = (review) => {
    setSelectedItem(review);
    setEditorContent(review.reviewContent);
    setRating(review.rating);
    setIsPublic(review.isPublic);
    setIsModalOpen(true);

    // ★ 로직 변경 핵심 ★
    // 1. 모두의 서재 탭이면 -> 무조건 읽기 전용 (수정 불가)
    if (activeTab === "public_library") {
        setIsReadOnly(true);
        setIsEditMode(false); 
    } 
    // 2. 내 서재 탭이면 -> 수정 모드
    else {
        setIsReadOnly(false);
        setIsEditMode(true);
    }
  };

  const handleSave = async () => {
    if (editorContent.replace(/<(.|\n)*?>/g, '').trim().length === 0) { alert("내용 입력!"); return; }
    const reviewData = {
      title: selectedItem.title, imageUrl: selectedItem.imageUrl, type: selectedItem.type, externalId: selectedItem.externalId,
      reviewContent: editorContent, rating: rating, isPublic: isPublic, userId: session?.user?.id
    };
    await sendRequest(`${API_URL}/api/Review`, 'POST', reviewData, "저장 완료!");
  };

  const handleUpdate = async () => {
    if (!window.confirm("수정하시겠습니까?")) return;
    const updateData = { reviewContent: editorContent, rating: rating, isPublic: isPublic, userId: session?.user?.id };
    await sendRequest(`${API_URL}/api/Review/${selectedItem.id}`, 'PUT', updateData, "수정 완료!");
  };

  const handleDelete = async () => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`${API_URL}/api/Review/${selectedItem.id}`, { method: 'DELETE' });
      if (response.ok) { alert("삭제됨"); closeModalAndRefresh(); }
    } catch (error) { console.error(error); }
  };

  const sendRequest = async (url, method, body, successMsg) => {
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (response.ok) { alert(successMsg); closeModalAndRefresh(); }
      else alert("실패");
    } catch (error) { alert("에러"); }
  };

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    fetchReviews();
    if(activeTab === "search") setActiveTab("my_library");
  };

  const publicReviews = allReviews.filter(r => r.isPublic === true);
  const myReviews = allReviews.filter(r => r.userId === session.user.id);

  if (!session) { /* 로그인 화면 (기존과 동일하여 생략, 위쪽 코드 참고) */
    return (
        <div style={{ padding: "50px", textAlign: "center", maxWidth: "400px", margin: "100px auto", border:"1px solid #ddd", borderRadius:"12px" }}>
          <h1>🔒 로그인</h1>
          <input type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"90%", padding:"10px", marginBottom:"10px"}} />
          <input type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"90%", padding:"10px", marginBottom:"20px"}} />
          <div style={{display:"flex", gap:"10px", justifyContent:"center"}}>
              <button onClick={handleLogin} style={{padding:"10px 20px", backgroundColor:"#007AFF", color:"white", border:"none", borderRadius:"5px", cursor:"pointer"}}>로그인</button>
              <button onClick={handleSignUp} style={{padding:"10px 20px", backgroundColor:"#333", color:"white", border:"none", borderRadius:"5px", cursor:"pointer"}}>회원가입</button>
          </div>
        </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", paddingBottom: "100px" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom:"30px" }}>🎬 내 문화생활 기록장</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "30px" }}>
        {["search", "public_library", "my_library"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "10px 15px", borderRadius: "20px", border:"none", cursor:"pointer", fontWeight: "bold", backgroundColor: activeTab === tab ? "#007AFF" : "#eee", color: activeTab === tab ? "white" : "#555" }}>
                {tab === "search" && "🔍 검색"}
                {tab === "public_library" && "🌏 모두의 서재"}
                {tab === "my_library" && "📚 내 서재"}
            </button>
        ))}
      </div>

      {activeTab === "search" && (
        <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                <input type="text" placeholder="제목 검색..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ padding: "12px", flex: 1, fontSize: "16px", borderRadius: "8px", border: "1px solid #ddd" }} />
                <button onClick={handleSearch} style={{ padding: "12px 24px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>검색</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "25px" }}>
                {searchResults.map((item, index) => (
                <div key={index} style={{ border: "1px solid #eee", borderRadius: "12px", padding: "15px", textAlign: "center" }}>
                    <img src={item.imageUrl} style={{ width: "100%", height: "280px", objectFit: "cover", borderRadius: "8px", marginBottom: "15px" }} />
                    <h3 style={{ fontSize: "16px", margin: "0 0 10px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</h3>
                    <button onClick={() => openWriteModal(item)} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>기록하기 ✍️</button>
                </div>
                ))}
            </div>
        </>
      )}

      {(activeTab === "public_library" || activeTab === "my_library") && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {(activeTab === "public_library" ? publicReviews : myReviews).length === 0 && <p style={{textAlign:"center", color:"#999", width:"100%"}}>아직 기록이 없습니다.</p>}
          
          {(activeTab === "public_library" ? publicReviews : myReviews).map((review) => (
            <div 
                key={review.id} 
                onClick={() => openDetailModal(review)} // [변경] 상세 보기 함수 호출
                style={{ 
                    border: "1px solid #ddd", borderRadius: "12px", padding: "20px", display: "flex", flexDirection:"column", gap: "15px", backgroundColor: "#fff", 
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", transition: "transform 0.2s",
                    background: (!review.isPublic && activeTab === "my_library") ? "#f9f9f9" : "#fff" 
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1.00)"}
            >
              <div style={{display:"flex", gap:"15px"}}>
                <img src={review.imageUrl} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 5px", fontSize: "18px" }}>
                    {review.title} 
                    {!review.isPublic && activeTab === "my_library" && <span style={{fontSize:"14px", marginLeft:"5px"}}>🔒</span>}
                  </h3>
                  <div style={{ color: "#f1c40f", fontSize: "14px" }}>{"★".repeat(review.rating)}</div>
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#aaa" }}>by {review.userId ? review.userId.substring(0,8) + "..." : "익명"}</p>
                </div>
              </div>
              <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", borderTop:"1px solid #eee", paddingTop:"10px", maxHeight:"60px", overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }} dangerouslySetInnerHTML={{ __html: review.reviewContent }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #eee", textAlign: "center" }}>
        <p style={{fontSize:"14px", color:"#888", marginBottom:"10px"}}>로그인 중: {session.user.email}</p>
        <button onClick={handleLogout} style={{padding:"8px 16px", backgroundColor:"#999", color:"white", border:"none", borderRadius:"20px", cursor:"pointer", fontSize:"13px"}}>로그아웃</button>
      </div>

      {/* --- 모달 창 --- */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} style={customModalStyles} contentLabel="리뷰 모달">
        {selectedItem && (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <h2 style={{marginTop:0}}>
                    {isReadOnly ? "📖 감상하기" : (isEditMode ? "✍️ 기록 수정" : "✏️ 기록 하기")}
                </h2>
                
                {/* 읽기 전용이 아닐 때만 공개 여부 체크박스 표시 */}
                {!isReadOnly && (
                    <label style={{display:"flex", alignItems:"center", cursor:"pointer", fontSize:"14px"}}>
                        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{width:"18px", height:"18px", marginRight:"5px"}}/>
                        전체 공개
                    </label>
                )}
            </div>
            <h3 style={{marginTop:0, color:"#555"}}>{selectedItem.title}</h3>
            
            {/* 별점 (읽기 전용일 땐 수정 불가하게 disabled 처리) */}
            <div style={{marginBottom: "20px"}}>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} disabled={isReadOnly} style={{padding:"5px", fontSize:"16px"}}>
                <option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option>
              </select>
            </div>

            {/* 에디터 또는 뷰어 */}
            <div style={{flex: 1, marginBottom: "50px", overflowY: "auto"}}>
              {isReadOnly ? (
                // [NEW] 읽기 전용일 때는 에디터 대신 내용을 보여주는 div 표시 (깔끔함)
                <div 
                    style={{ lineHeight: "1.6", fontSize: "16px", color: "#333" }}
                    dangerouslySetInnerHTML={{ __html: editorContent }} 
                />
              ) : (
                // 수정/작성 모드일 때는 에디터 표시
                <ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} style={{height: "250px"}} placeholder="내용을 입력하세요..." />
              )}
            </div>

            {/* 버튼 영역 */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer" }}>
                {isReadOnly ? "닫기" : "취소"}
              </button>

              {/* 읽기 전용이 아닐 때만 저장/수정/삭제 버튼 표시 */}
              {!isReadOnly && (
                  isEditMode ? (
                    <>
                        <button onClick={handleDelete} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#ff4d4d", color: "white", fontWeight: "bold", cursor: "pointer" }}>삭제</button>
                        <button onClick={handleUpdate} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>수정 완료</button>
                    </>
                  ) : (
                    <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>저장하기</button>
                  )
              )}
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}

export default App;