import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createClient } from '@supabase/supabase-js'; // [NEW] 로그인용

// [NEW] Supabase 클라이언트 설정 (직접 로그인을 위해)
// .env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_KEY를 추가해야 합니다!
// (일단 편의상 하드코딩하거나, 환경변수 설정을 권장합니다.)
// 지금은 백엔드 API를 통해서가 아니라 프론트에서 바로 로그인을 체크하는 방식입니다.

// ★ 중요: 여기에 본인의 Supabase URL과 Key를 넣어야 로그인이 됩니다! (VS Code의 appsettings.json에 있는 거 쓰시면 됩니다)
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
  // --- 상태 관리 ---
  const [session, setSession] = useState(null); // [NEW] 로그인 정보
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isPublic, setIsPublic] = useState(true); // [NEW] 공개 여부 상태

  const API_URL = import.meta.env.VITE_API_URL;

  // [NEW] 앱 시작 시 로그인 여부 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // [NEW] 로그인 함수
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
    else alert("로그인 되었습니다!");
  };

  // [NEW] 회원가입 함수
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("가입 실패: " + error.message);
    else alert("가입 확인 메일을 보냈습니다! (또는 자동 로그인)");
  };

  // [NEW] 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMyReviews([]); // 로그아웃하면 목록 비우기
  };

  // 1. 검색
  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await fetch(`${API_URL}/api/Search/${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) { alert("검색 실패!"); }
  };

  // 2. 모달 열기 (작성)
  const openWriteModal = (item) => {
    setIsEditMode(false);
    setSelectedItem(item);
    setEditorContent("");
    setRating(5);
    setIsPublic(true); // 기본은 공개
    setIsModalOpen(true);
  };

  // 3. 모달 열기 (수정)
  const openEditModal = (review) => {
    // [중요] 내 글이 아니면 수정 못하게 막기 (화면상 처리)
    if (review.userId && session && review.userId !== session.user.id) {
      alert("작성자만 수정할 수 있습니다.");
      return;
    }

    setIsEditMode(true);
    setSelectedItem(review);
    setEditorContent(review.reviewContent);
    setRating(review.rating);
    setIsPublic(review.isPublic); // [NEW] 기존 공개여부 불러오기
    setIsModalOpen(true);
  };

  // 4. 저장 (Create)
  const handleSave = async () => {
    if (editorContent.replace(/<(.|\n)*?>/g, '').trim().length === 0) {
      alert("내용을 입력해주세요!"); return;
    }

    const reviewData = {
      title: selectedItem.title,
      imageUrl: selectedItem.imageUrl,
      type: selectedItem.type,
      externalId: selectedItem.externalId,
      reviewContent: editorContent,
      rating: rating,
      isPublic: isPublic, // [NEW] 선택한 공개여부 전송
      userId: session?.user?.id // [NEW] 내 아이디 전송
    };

    try {
      const response = await fetch(`${API_URL}/api/Review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        alert("저장 완료! 📚");
        closeModalAndRefresh();
      } else { alert("저장 실패"); }
    } catch (error) { alert("에러 발생"); }
  };

  // 5. 수정 (Update)
  const handleUpdate = async () => {
    if (!window.confirm("수정하시겠습니까?")) return;

    const updateData = {
      reviewContent: editorContent,
      rating: rating,
      isPublic: isPublic, // [NEW] 수정된 공개여부 전송
      userId: session?.user?.id // 아이디도 같이 보냄 (백엔드 검증용)
    };

    try {
      const response = await fetch(`${API_URL}/api/Review/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert("수정 완료! ✨");
        closeModalAndRefresh();
      } else { alert("수정 실패"); }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async () => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`${API_URL}/api/Review/${selectedItem.id}`, { method: 'DELETE' });
      if (response.ok) { alert("삭제됨"); closeModalAndRefresh(); }
    } catch (error) { console.error(error); }
  };

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    if (activeTab === "library") fetchMyReviews();
    else setActiveTab("library");
  };

  // [NEW] 목록 조회 (내 아이디를 알려줘서 비공개 글도 받아옴)
  const fetchMyReviews = async () => {
    const myId = session?.user?.id || "";
    try {
      // 쿼리 파라미터로 userId 전달
      const response = await fetch(`${API_URL}/api/Review?userId=${myId}`);
      const data = await response.json();
      setMyReviews(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (activeTab === "library") fetchMyReviews();
  }, [activeTab, session]); // 세션이 바뀌면(로그인하면) 목록 다시 불러오기

  // --- 렌더링 ---

  // 1. 로그인이 안 되어 있으면 로그인 화면 보여주기
  if (!session) {
    return (
      <div style={{ padding: "50px", textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
        <h1>🔒 로그인 필요</h1>
        <p>나만의 문화생활 기록을 시작하세요.</p>
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "20px" }} />
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={handleLogin} style={{ padding: "10px 20px", backgroundColor: "#007AFF", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>로그인</button>
          <button onClick={handleSignUp} style={{ padding: "10px 20px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>회원가입</button>
        </div>
      </div>
    );
  }

  // 2. 로그인 되면 앱 보여주기
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#333" }}>🎬 내 문화생활 기록장</h1>
        <button onClick={handleLogout} style={{ padding: "5px 10px", fontSize: "12px", cursor: "pointer" }}>로그아웃</button>
      </div>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
        <button onClick={() => setActiveTab("search")} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeTab === "search" ? "#007AFF" : "#eee", color: activeTab === "search" ? "white" : "#333", fontWeight: "bold" }}>🔍 검색하기</button>
        <button onClick={() => setActiveTab("library")} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: activeTab === "library" ? "#007AFF" : "#eee", color: activeTab === "library" ? "white" : "#333", fontWeight: "bold" }}>📚 내 서재</button>
      </div>

      {/* 검색 화면 */}
      {activeTab === "search" && (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
            <input type="text" placeholder="제목 검색..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ padding: "12px", flex: 1, fontSize: "16px", borderRadius: "8px", border: "1px solid #ddd" }} />
            <button onClick={handleSearch} style={{ padding: "12px 24px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>검색</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "25px" }}>
            {searchResults.map((item, index) => (
              <div key={index} style={{ border: "1px solid #eee", borderRadius: "12px", padding: "15px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "280px", objectFit: "cover", borderRadius: "8px", marginBottom: "15px" }} />
                <h3 style={{ fontSize: "16px", margin: "0 0 10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</h3>
                <button onClick={() => openWriteModal(item)} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>기록하기 ✍️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 내 서재 화면 */}
      {activeTab === "library" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {myReviews.map((review) => (
            <div
              key={review.id}
              onClick={() => openEditModal(review)}
              style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1.00)"}
            >
              <div style={{ display: "flex", gap: "15px" }}>
                <img src={review.imageUrl} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 5px", fontSize: "18px" }}>
                    {review.title}
                    {/* 비밀글이면 자물쇠 표시 */}
                    {!review.isPublic && <span style={{ fontSize: "14px", marginLeft: "5px" }}>🔒</span>}
                  </h3>
                  <div style={{ color: "#f1c40f", fontSize: "14px" }}>{"★".repeat(review.rating)}</div>
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#aaa" }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div
                style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", borderTop: "1px solid #eee", paddingTop: "10px", maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                dangerouslySetInnerHTML={{ __html: review.reviewContent }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 모달 창 */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} style={customModalStyles} contentLabel="리뷰 모달">
        {selectedItem && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ marginTop: 0 }}>{isEditMode ? "📖 기록 수정하기" : "✏️ 새 기록 남기기"}</h2>

              {/* [NEW] 공개 여부 체크박스 */}
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ width: "18px", height: "18px", marginRight: "5px" }}
                />
                전체 공개
              </label>
            </div>

            <h3 style={{ marginTop: 0, color: "#555" }}>{selectedItem.title}</h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold", marginRight: "10px" }}>별점:</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: "5px", fontSize: "16px" }}>
                <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
                <option value="4">⭐⭐⭐⭐ (4점)</option>
                <option value="3">⭐⭐⭐ (3점)</option>
                <option value="2">⭐⭐ (2점)</option>
                <option value="1">⭐ (1점)</option>
              </select>
            </div>

            <div style={{ flex: 1, marginBottom: "50px" }}>
              <ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} style={{ height: "250px" }} placeholder="감상평을 입력하세요..." />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer" }}>취소</button>
              {isEditMode ? (
                <>
                  <button onClick={handleDelete} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#ff4d4d", color: "white", fontWeight: "bold", cursor: "pointer" }}>삭제</button>
                  <button onClick={handleUpdate} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>수정 완료</button>
                </>
              ) : (
                <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>저장하기</button>
              )}
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}

export default App;