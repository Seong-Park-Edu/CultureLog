import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css'; 

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
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState([]); 
  const [myReviews, setMyReviews] = useState([]);

  // 모달 & 에디터 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // [NEW] 수정 모드인지 확인
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [rating, setRating] = useState(5);

  const API_URL = import.meta.env.VITE_API_URL; // 주소 줄이기

  // 1. 검색
  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await fetch(`${API_URL}/api/Search/${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) { alert("검색 실패!"); }
  };

  // 2. 모달 열기 (새 글 작성 모드)
  const openWriteModal = (item) => {
    setIsEditMode(false); // 수정 모드 끄기
    setSelectedItem(item);
    setEditorContent(""); 
    setRating(5); 
    setIsModalOpen(true);
  };

  // 3. [NEW] 모달 열기 (수정 모드 - 내 서재에서 클릭 시)
  const openEditModal = (review) => {
    setIsEditMode(true); // 수정 모드 켜기
    setSelectedItem(review); // 기존 리뷰 데이터를 선택된 아이템으로 설정
    setEditorContent(review.reviewContent); // 기존 내용을 에디터에 채움!
    setRating(review.rating); // 기존 별점 채움!
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
      isPublic: true
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

  // 5. [NEW] 수정 (Update)
  const handleUpdate = async () => {
    if (!window.confirm("내용을 수정하시겠습니까?")) return;

    const updateData = {
        reviewContent: editorContent,
        rating: rating
    };

    try {
        const response = await fetch(`${API_URL}/api/Review/${selectedItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });

        if (response.ok) {
            alert("수정되었습니다! ✨");
            closeModalAndRefresh();
        } else { alert("수정 실패"); }
    } catch (error) { console.error(error); }
  };

  // 6. 삭제 (Delete) - 모달 안에서 실행
  const handleDelete = async () => {
    if (!window.confirm("정말 이 기록을 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`${API_URL}/api/Review/${selectedItem.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert("삭제되었습니다. 🗑️");
        closeModalAndRefresh();
      }
    } catch (error) { console.error(error); }
  };

  // 공통: 모달 닫고 목록 갱신
  const closeModalAndRefresh = () => {
      setIsModalOpen(false);
      if (activeTab === "library") fetchMyReviews(); // 서재에 있다면 목록 갱신
      else setActiveTab("library"); // 검색 탭이었다면 서재로 이동
  };

  const fetchMyReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Review`);
      const data = await response.json();
      setMyReviews(data);
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
                <button onClick={() => openWriteModal(item)} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>기록하기 ✍️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 내 서재 화면 */}
      {activeTab === "library" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
           {/* [변경] 카드를 클릭하면 openEditModal 실행 */}
          {myReviews.map((review) => (
            <div 
                key={review.id} 
                onClick={() => openEditModal(review)} // 클릭 시 상세/수정 모달 열기
                style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px", display: "flex", flexDirection:"column", gap: "15px", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", transition: "transform 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1.00)"}
            >
              <div style={{display:"flex", gap:"15px"}}>
                <img src={review.imageUrl} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 5px", fontSize: "18px" }}>{review.title}</h3>
                  <div style={{ color: "#f1c40f", fontSize: "14px" }}>{"★".repeat(review.rating)}</div>
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#aaa" }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* 목록에서는 미리보기로 내용의 일부만 보여주거나 텍스트만 보여줌 */}
              <div 
                style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", borderTop:"1px solid #eee", paddingTop:"10px", maxHeight:"60px", overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}
                dangerouslySetInnerHTML={{ __html: review.reviewContent }} 
              />
            </div>
          ))}
        </div>
      )}

      {/* 통합 모달 창 (작성/수정 공용) */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={customModalStyles}
        contentLabel="리뷰 모달"
      >
        {selectedItem && (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <h2 style={{marginTop:0}}>
                    {isEditMode ? "📖 기록 수정하기" : "✏️ 새 기록 남기기"}
                </h2>
                {/* 썸네일 작게 표시 */}
                {isEditMode && <span style={{fontSize:"14px", color:"#888"}}>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>}
            </div>
            <h3 style={{marginTop:0, color:"#555"}}>{selectedItem.title}</h3>
            
            <div style={{marginBottom: "20px"}}>
              <label style={{fontWeight:"bold", marginRight:"10px"}}>별점:</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{padding:"5px", fontSize:"16px"}}>
                <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
                <option value="4">⭐⭐⭐⭐ (4점)</option>
                <option value="3">⭐⭐⭐ (3점)</option>
                <option value="2">⭐⭐ (2점)</option>
                <option value="1">⭐ (1점)</option>
              </select>
            </div>

            <div style={{flex: 1, marginBottom: "50px"}}>
              <ReactQuill 
                theme="snow" 
                value={editorContent} 
                onChange={setEditorContent} 
                style={{height: "250px"}} 
                placeholder="감상평을 입력하세요..."
              />
            </div>

            {/* 버튼 영역: 모드에 따라 다르게 보여줌 */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer" }}>취소</button>
              
              {isEditMode ? (
                // 수정 모드일 때 버튼들
                <>
                    <button onClick={handleDelete} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#ff4d4d", color: "white", fontWeight: "bold", cursor: "pointer" }}>삭제</button>
                    <button onClick={handleUpdate} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", backgroundColor: "#007AFF", color: "white", fontWeight: "bold", cursor: "pointer" }}>수정 완료</button>
                </>
              ) : (
                // 작성 모드일 때 버튼
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