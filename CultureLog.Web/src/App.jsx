import { useState, useEffect } from 'react';
import Modal from 'react-modal'; // [NEW] 팝업창 라이브러리
import ReactQuill from 'react-quill-new'; // [NEW] 에디터 라이브러리
import 'react-quill-new/dist/quill.snow.css'; // [NEW] 에디터 스타일

// 모달 스타일 설정 (화면 중앙 정렬)
const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '600px',
    height: '80%',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 배경을 어둡게
    zIndex: 1000
  }
};

// 시각 장애인 보조기능을 위해 앱 요소를 지정 (필수 설정)
Modal.setAppElement('#root');

function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState([]); 
  const [myReviews, setMyReviews] = useState([]);

  // [NEW] 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림 여부
  const [selectedItem, setSelectedItem] = useState(null); // 어떤 영화에 대해 쓰는 중인지
  const [editorContent, setEditorContent] = useState(""); // 에디터에 쓴 내용 (HTML)
  const [rating, setRating] = useState(5); // 별점

  // 1. 검색 기능 (환경변수 사용)
  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Search/${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      alert("검색 실패!");
    }
  };

  // 2. [NEW] 모달 열기 (기록하기 버튼 누르면 실행)
  const openWriteModal = (item) => {
    setSelectedItem(item);
    setEditorContent(""); // 내용 초기화
    setRating(5); // 별점 초기화
    setIsModalOpen(true); // 창 열기
  };

  // 3. [NEW] 진짜 저장 기능 (모달 안에서 '저장' 눌렀을 때)
  const handleSaveReview = async () => {
    if (!selectedItem) return;

    // 에디터 내용이 비었는지 체크 (HTML 태그 제거하고 텍스트만 확인)
    if (editorContent.replace(/<(.|\n)*?>/g, '').trim().length === 0) {
      alert("내용을 입력해주세요!");
      return;
    }

    const reviewData = {
      title: selectedItem.title,
      imageUrl: selectedItem.imageUrl,
      type: selectedItem.type,
      externalId: selectedItem.externalId,
      reviewContent: editorContent, // [중요] HTML 태그가 포함된 내용을 그대로 저장
      rating: rating,
      isPublic: true
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        alert("저장 완료! 📚");
        setIsModalOpen(false); // 창 닫기
        setActiveTab("library"); // 서재 탭으로 이동
        fetchMyReviews(); // 목록 갱신
      } else {
        alert("저장 실패");
      }
    } catch (error) {
      alert("에러 발생");
    }
  };

  const fetchMyReviews = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Review`);
      const data = await response.json();
      setMyReviews(data);
    } catch (error) {
      console.error("서재 불러오기 실패:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Review/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) fetchMyReviews();
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (activeTab === "library") fetchMyReviews();
  }, [activeTab]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>🎬 내 문화생활 기록장</h1>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
        <button onClick={() => setActiveTab("search")} style={{ padding: "10px 20px", borderRadius: "20px", border:"none", cursor:"pointer", backgroundColor: activeTab === "search" ? "#007AFF" : "#eee", color: activeTab === "search" ? "white" : "#333", fontWeight: "bold" }}>🔍 검색하기</button>
        <button onClick={() => setActiveTab("library")} style={{ padding: "10px 20px", borderRadius: "20px", border:"none", cursor:"pointer", backgroundColor: activeTab === "library" ? "#007AFF" : "#eee", color: activeTab === "library" ? "white" : "#333", fontWeight: "bold" }}>📚 내 서재</button>
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
                <h3 style={{ fontSize: "16px", margin: "0 0 10px", whiteSpace: "nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.title}</h3>
                {/* [변경] 버튼 누르면 모달 열기 */}
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
            <div key={review.id} style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px", display: "flex", flexDirection:"column", gap: "15px", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative" }}>
              <div style={{display:"flex", gap:"15px"}}>
                <img src={review.imageUrl} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 5px", fontSize: "18px" }}>{review.title}</h3>
                  <div style={{ color: "#f1c40f", fontSize: "14px" }}>{"★".repeat(review.rating)}</div>
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#aaa" }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* [중요] HTML 내용을 안전하게 보여주기 위해 dangerouslySetInnerHTML 사용 */}
              <div 
                style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", borderTop:"1px solid #eee", paddingTop:"10px" }}
                dangerouslySetInnerHTML={{ __html: review.reviewContent }} 
              />

              <button onClick={() => handleDelete(review.id)} style={{ position: "absolute", top: "15px", right: "15px", backgroundColor: "#ff4d4d", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>삭제</button>
            </div>
          ))}
        </div>
      )}

      {/* [NEW] 글쓰기 모달 창 */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={customModalStyles}
        contentLabel="리뷰 작성"
      >
        {selectedItem && (
          <>
            <h2 style={{marginTop:0}}>✏️ '{selectedItem.title}' 기록하기</h2>
            
            {/* 별점 선택 */}
            <div style={{marginBottom: "20px"}}>
              <label style={{fontWeight:"bold", marginRight:"10px"}}>별점:</label>
              <select 
                value={rating} 
                onChange={(e) => setRating(Number(e.target.value))}
                style={{padding:"5px", fontSize:"16px"}}
              >
                <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
                <option value="4">⭐⭐⭐⭐ (4점)</option>
                <option value="3">⭐⭐⭐ (3점)</option>
                <option value="2">⭐⭐ (2점)</option>
                <option value="1">⭐ (1점)</option>
              </select>
            </div>

            {/* 위즈위그 에디터 (ReactQuill) */}
            <div style={{flex: 1, marginBottom: "50px"}}> {/* 에디터 공간 확보 */}
              <ReactQuill 
                theme="snow" 
                value={editorContent} 
                onChange={setEditorContent} 
                style={{height: "250px"}} 
                placeholder="자유롭게 감상평을 남겨보세요! (꾸미기 가능)"
              />
            </div>

            {/* 하단 버튼 */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer" }}>취소</button>
              <button onClick={handleSaveReview} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>저장하기</button>
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}

export default App;