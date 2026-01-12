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

  // [NEW] 서재용 필터 상태들
  const [filterKeyword, setFilterKeyword] = useState(""); // 검색어
  const [filterGenre, setFilterGenre] = useState("All");  // 장르
  const [filterRating, setFilterRating] = useState("All"); // 별점

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
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

  // API 검색 (외부)
  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await fetch(`${API_URL}/api/Search/${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) { alert("검색 실패!"); }
  };

  // 전체 리뷰 가져오기
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
      // 탭이 바뀔 때 필터 초기화 (선택 사항)
      setFilterKeyword("");
      setFilterGenre("All");
      setFilterRating("All");
    }
  }, [activeTab, session]);

  // [NEW] ★ 핵심 로직: 현재 탭과 필터 조건에 맞는 목록만 걸러내기
  const getFilteredReviews = () => {
    // 1. 탭 구분 (모두의 서재 vs 내 서재)
    let filtered = activeTab === "public_library"
      ? allReviews.filter(r => r.isPublic === true)
      : allReviews.filter(r => r.userId === session.user.id);

    // 2. 검색어 필터 (제목이나 내용에 포함되어 있으면 통과)
    if (filterKeyword) {
      const lowerKeyword = filterKeyword.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(lowerKeyword) ||
        r.reviewContent.toLowerCase().includes(lowerKeyword)
      );
    }

    // 3. 장르 필터
    if (filterGenre !== "All") {
      filtered = filtered.filter(r => r.type === filterGenre);
    }

    // 4. 별점 필터
    if (filterRating !== "All") {
      filtered = filtered.filter(r => r.rating === Number(filterRating));
    }

    return filtered;
  };

  // UI 헬퍼: 현재 데이터에 존재하는 장르 목록만 뽑아오기 (중복제거)
  const getAvailableGenres = () => {
    const genres = allReviews.map(r => r.type).filter(t => t); // null 제외
    return ["All", ...new Set(genres)]; // 중복 제거
  };

  // --- 기존 모달 및 API 로직들 (변경 없음) ---
  const openWriteModal = (item) => {
    setIsEditMode(false); setIsReadOnly(false); setSelectedItem(item); setEditorContent(""); setRating(5); setIsPublic(true); setIsModalOpen(true);
  };

  const openDetailModal = (review) => {
    setSelectedItem(review); setEditorContent(review.reviewContent); setRating(review.rating); setIsPublic(review.isPublic); setIsModalOpen(true);
    if (activeTab === "public_library") { setIsReadOnly(true); setIsEditMode(false); }
    else { setIsReadOnly(false); setIsEditMode(true); }
  };

  const handleSave = async () => { /* 내용 생략 (기존 동일) */
    if (editorContent.replace(/<(.|\n)*?>/g, '').trim().length === 0) { alert("내용 입력!"); return; }
    const reviewData = { title: selectedItem.title, imageUrl: selectedItem.imageUrl, type: selectedItem.type, externalId: selectedItem.externalId, reviewContent: editorContent, rating: rating, isPublic: isPublic, userId: session?.user?.id, author: selectedItem.author || "" };
    await sendRequest(`${API_URL}/api/Review`, 'POST', reviewData, "저장 완료!");
  };
  const handleUpdate = async () => { /* 내용 생략 (기존 동일) */
    if (!window.confirm("수정하시겠습니까?")) return;
    const updateData = { reviewContent: editorContent, rating: rating, isPublic: isPublic, userId: session?.user?.id };
    await sendRequest(`${API_URL}/api/Review/${selectedItem.id}`, 'PUT', updateData, "수정 완료!");
  };
  const handleDelete = async () => { /* 내용 생략 (기존 동일) */
    if (!window.confirm("삭제하시겠습니까?")) return;
    try { const response = await fetch(`${API_URL}/api/Review/${selectedItem.id}`, { method: 'DELETE' }); if (response.ok) { alert("삭제됨"); closeModalAndRefresh(); } } catch (error) { console.error(error); }
  };
  const sendRequest = async (url, method, body, successMsg) => {
    try { const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (response.ok) { alert(successMsg); closeModalAndRefresh(); } else alert("실패"); } catch (error) { alert("에러"); }
  };
  const closeModalAndRefresh = () => { setIsModalOpen(false); fetchReviews(); if (activeTab === "search") setActiveTab("my_library"); };

  // --- 렌더링 ---
  // 1. 로그인이 안 되어 있으면 로그인 화면 보여주기 (이 부분을 복사해서 덮어쓰세요!)
  if (!session) {
    return (
      <div style={{ padding: "50px", textAlign: "center", maxWidth: "400px", margin: "100px auto", border: "1px solid #ddd", borderRadius: "12px" }}>
        <h1>🔒 로그인</h1>
        <p style={{ marginBottom: "30px", color: "#666" }}>나만의 문화생활 기록을 시작하세요.</p>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "90%", padding: "12px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "90%", padding: "12px", marginBottom: "20px", borderRadius: "6px", border: "1px solid #ddd" }}
        />

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={handleLogin} style={{ padding: "10px 20px", backgroundColor: "#007AFF", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>로그인</button>
          <button onClick={handleSignUp} style={{ padding: "10px 20px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>회원가입</button>
        </div>
      </div>
    );
  }

  // ★ 최종적으로 화면에 보여줄 목록 (필터 적용됨)
  const displayReviews = getFilteredReviews();

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", paddingBottom: "100px" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>🎬 내 문화생활 기록장</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "30px" }}>
        {["search", "public_library", "my_library"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "10px 15px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: activeTab === tab ? "#007AFF" : "#eee", color: activeTab === tab ? "white" : "#555" }}>
            {tab === "search" && "🔍 검색"}
            {tab === "public_library" && "🌏 모두의 서재"}
            {tab === "my_library" && "📚 내 서재"}
          </button>
        ))}
      </div>

      {/* 1. API 검색 화면 */}
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
                <h3 style={{ fontSize: "16px", margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h3>
                {/* [NEW] 검색 결과에도 작가 표시 */}
                <p style={{ fontSize: "13px", color: "#666", margin: "0 0 10px" }}>{item.author}</p>
                <button onClick={() => openWriteModal(item)} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>기록하기 ✍️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 2. 서재 화면 (필터 기능 추가됨!) */}
      {(activeTab === "public_library" || activeTab === "my_library") && (
        <>
          {/* [NEW] 필터 및 검색바 영역 */}
          <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "12px", marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* 검색어 입력 */}
            <input
              type="text"
              placeholder="내 서재에서 검색..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              style={{ flex: 1, minWidth: "200px", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
            />

            {/* 장르 선택 */}
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
              {getAvailableGenres().map(g => (
                <option key={g} value={g}>{g === "All" ? "모든 장르" : g}</option>
              ))}
            </select>

            {/* 별점 선택 */}
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
              <option value="All">모든 별점</option>
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>

          {/* 카드 리스트 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {displayReviews.length === 0 && <p style={{ textAlign: "center", color: "#999", width: "100%", gridColumn: "1 / -1" }}>조건에 맞는 기록이 없습니다.</p>}

            {displayReviews.map((review) => (
              <div key={review.id} onClick={() => openDetailModal(review)}
                style={{
                  border: "1px solid #ddd", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", transition: "transform 0.2s",
                  background: (!review.isPublic && activeTab === "my_library") ? "#f9f9f9" : "#fff"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1.00)"}
              >
                <div style={{ display: "flex", gap: "15px" }}>
                  <img src={review.imageUrl} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 5px", fontSize: "18px" }}>
                      {review.title}
                      {!review.isPublic && activeTab === "my_library" && <span style={{ fontSize: "14px", marginLeft: "5px" }}>🔒</span>}
                    </h3>
                    {/* [NEW] 작가/개봉일 표시 */}
                    <p style={{ margin: "0 0 5px", fontSize: "13px", color: "#555", fontWeight: "bold" }}>
                      {review.type === 'book' ? '✍️ ' : '📅 '}
                      {review.author}
                    </p>
                    <div style={{ color: "#f1c40f", fontSize: "14px" }}>{"★".repeat(review.rating)}</div>
                    <p style={{ margin: "5px 0", fontSize: "12px", color: "#666", backgroundColor: "#eee", display: "inline-block", padding: "2px 6px", borderRadius: "4px" }}>{review.type}</p>
                    <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#aaa" }}>by {review.userId ? review.userId.substring(0, 8) + "..." : "익명"}</p>
                  </div>
                </div>
                <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", borderTop: "1px solid #eee", paddingTop: "10px", maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }} dangerouslySetInnerHTML={{ __html: review.reviewContent }} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 하단 로그아웃 */}
      <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #eee", textAlign: "center" }}>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "10px" }}>로그인 중: {session.user.email}</p>
        <button onClick={handleLogout} style={{ padding: "8px 16px", backgroundColor: "#999", color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}>로그아웃</button>
      </div>

      {/* 모달 창 (기존과 동일하여 내용 생략 - 전체 코드 복사시 포함됨) */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} style={customModalStyles} contentLabel="리뷰 모달">
        {selectedItem && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ marginTop: 0 }}>{isReadOnly ? "📖 감상하기" : (isEditMode ? "✍️ 기록 수정" : "✏️ 기록 하기")}</h2>
              {!isReadOnly && (<label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ width: "18px", height: "18px", marginRight: "5px" }} />전체 공개</label>)}
            </div>
            <h3 style={{ marginTop: 0, color: "#555" }}>{selectedItem.title}</h3>
            <div style={{ marginBottom: "20px" }}>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} disabled={isReadOnly} style={{ padding: "5px", fontSize: "16px" }}><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select>
            </div>
            <div style={{ flex: 1, marginBottom: "50px", overflowY: "auto" }}>
              {isReadOnly ? (<div style={{ lineHeight: "1.6", fontSize: "16px", color: "#333" }} dangerouslySetInnerHTML={{ __html: editorContent }} />) : (<ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} style={{ height: "250px" }} placeholder="내용을 입력하세요..." />)}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer" }}>{isReadOnly ? "닫기" : "취소"}</button>
              {!isReadOnly && (isEditMode ? (<><button onClick={handleDelete} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#ff4d4d", color: "white", fontWeight: "bold", cursor: "pointer" }}>삭제</button><button onClick={handleUpdate} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>수정 완료</button></>) : (<button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>저장하기</button>))}
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}

export default App;