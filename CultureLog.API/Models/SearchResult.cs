namespace CultureLog.API.Models //주소지 설정: "이 파일은 CultureLog.API 건물의 Models 방에 있습니다"라고 선언하는 것입니다.
{
    // 영화, 책, 웹툰 검색 결과를 담을 공통 그릇
    public class SearchResult //설계도 선언: "지금부터 SearchResult라는 이름의 데이터 틀을 정의합니다."
    {
        // 1. 제목 (예: 아이언맨)
        public string Title { get; set; } = string.Empty;

        // 2. 이미지 주소 (예: https://...)
        // 이미지가 없을 수도 있으니 '?'를 붙여서 빈 값(null) 허용
        public string? ImageUrl { get; set; }

        // 3. 출시일 (예: 2008-04-30)
        public string? ReleaseDate { get; set; }

        // 4. 종류 (Movie, Book)
        public string Type { get; set; } = string.Empty;

        // 5. 외부 ID (나중에 상세 정보를 찾기 위한 키)
        public string ExternalId { get; set; } = string.Empty;

        public string Author { get; set; } = string.Empty;
    }
}