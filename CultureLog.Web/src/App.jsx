import { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // 1. 검색 기능
  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await fetch(`http://https://culturelog-api.onrender.com/api/Search/${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      alert("검색 실패!");
    }
  };

  // 2. 저장 기능
  const handleSave = async (item) => {
    const reviewContent = prompt(`'${item.title}' 어떠셨나요?\n한줄평을 남겨주세요!`);
    if (reviewContent === null) return;
    const ratingInput = prompt("별점은 몇 점 주실래요? (1~5)");
    const rating = parseInt(ratingInput) || 5;

    const reviewData = {
      title: item.title,
      imageUrl: item.imageUrl,
      type: item.type,
      externalId: item.externalId,
      reviewContent: reviewContent,
      rating: rating,
      isPublic: true
    };

    try {
      const response = await fetch('http://https://culturelog-api.onrender.com/api/Review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        alert("저장 완료! 내 서재에서 확인하세요.");
        // 저장 후 자동으로 서재 탭으로 이동하고 목록 갱신
        setActiveTab("library");
        fetchMyReviews(); 
      } else {
        alert("저장 실패");
      }
    } catch (error) {
      alert("에러 발생");
    }
  };

  // 3. 내 서재 목록 가져오기
  const fetchMyReviews = async () => {
    try {
      const response = await fetch('http://https://culturelog-api.onrender.com/api/Review');
      const data = await response.json();
      setMyReviews(data);
    } catch (error) {
      console.error("서재 불러오기 실패:", error);
    }
  };

  // 4. [NEW] 삭제 기능 ★
  const handleDelete = async (id) => {
    if (!window.confirm("정말 이 기록을 삭제하시겠습니까?")) return;

    try {
      // DELETE 요청 보내기 (URL 끝에 id를 붙여서 보냄)
      const response = await fetch(`http://https://culturelog-api.onrender.com/api/Review/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert("삭제되었습니다. 🗑️");
        fetchMyReviews(); // 목록 다시 불러오기 (새로고침 효과)
      } else {
        alert("삭제 실패");
      }
    } catch (error) {
      console.error("삭제 에러:", error);
      alert("서버 통신 오류");
    }
  };

  useEffect(() => {
    if (activeTab === "library") {
      fetchMyReviews();
    }
  }, [activeTab]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>🎬 내 문화생활 기록장</h1>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
        <button 
          onClick={() => setActiveTab("search")}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", border: "none", borderRadius: "20px", backgroundColor: activeTab === "search" ? "#007AFF" : "#eee", color: activeTab === "search" ? "white" : "#333", fontWeight: "bold" }}
        >
          🔍 검색하기
        </button>
        <button 
          onClick={() => setActiveTab("library")}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", border: "none", borderRadius: "20px", backgroundColor: activeTab === "library" ? "#007AFF" : "#eee", color: activeTab === "library" ? "white" : "#333", fontWeight: "bold" }}
        >
          📚 내 서재
        </button>
      </div>

      {/* 검색 화면 */}
      {activeTab === "search" && (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
            <input 
              type="text" 
              placeholder="제목 검색..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ padding: "12px", flex: 1, fontSize: "16px", borderRadius: "8px", border: "1px solid #ddd" }}
            />
            <button onClick={handleSearch} style={{ padding: "12px 24px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>검색</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "25px" }}>
            {searchResults.map((item, index) => (
              <div key={index} style={{ border: "1px solid #eee", borderRadius: "12px", padding: "15px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "280px", objectFit: "cover", borderRadius: "8px", marginBottom: "15px" }} />
                <h3 style={{ fontSize: "16px", margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h3>
                <button onClick={() => handleSave(item)} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>기록하기 ✍️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 내 서재 화면 (삭제 버튼 추가됨) */}
      {activeTab === "library" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {myReviews.length === 0 ? <p style={{textAlign:"center", width:"100%"}}>아직 기록된게 없어요!</p> : null}
          
          {myReviews.map((review) => (
            <div key={review.id} style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px", display: "flex", gap: "15px", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative" }}>
              
              <img src={review.imageUrl} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px" }} />
              
              <div style={{ flex: 1, textAlign: "left" }}>
                <h3 style={{ margin: "0 0 5px", fontSize: "18px" }}>{review.title}</h3>
                <div style={{ color: "#f1c40f", fontSize: "14px", marginBottom: "10px" }}>{"★".repeat(review.rating)}</div>
                <p style={{ margin: "0", fontSize: "14px", color: "#555", lineHeight: "1.5" }}>{review.reviewContent}</p>
                <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#aaa" }}>{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>

              {/* [NEW] 삭제 버튼 (우측 상단에 배치) */}
              <button 
                onClick={() => handleDelete(review.id)}
                style={{ 
                  position: "absolute", top: "15px", right: "15px", 
                  backgroundColor: "#ff4d4d", color: "white", 
                  border: "none", borderRadius: "5px", 
                  padding: "5px 10px", cursor: "pointer", fontSize: "12px" 
                }}
              >
                삭제
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;