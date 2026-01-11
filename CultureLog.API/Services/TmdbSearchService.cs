using System.Text.Json.Nodes; // JSON 파싱 도구
using CultureLog.API.Models;

namespace CultureLog.API.Services
{
    public class TmdbSearchService : ISearchService
    {
        private readonly HttpClient _httpClient; // 통신 도구 (전화기)
        private readonly string _apiKey;         // 금고 열쇠 (API Key)

        // [생성자 주입] 
        // 1. HttpClient: ASP.NET이 인터넷 쓸 수 있는 전화기를 쥐여줌
        // 2. IConfiguration: 비밀 금고 관리자. 여기서 키를 꺼냄.
        public TmdbSearchService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            // appsettings.json의 "ApiKeys" -> "Tmdb" 값을 꺼내옴
            _apiKey = config["ApiKeys:Tmdb"]; 
        }

        // 실제 검색 로직
        public async Task<List<SearchResult>> SearchAsync(string query)
        {
            // 1. TMDB 요청 주소 만들기 (한국어 설정 포함)
            var url = $"https://api.themoviedb.org/3/search/movie?api_key={_apiKey}&query={query}&language=ko-KR";

            // 2. 인터넷으로 요청 보내기 (Get)
            // await: 답장 올 때까지 다른 일 하며 기다림
            var response = await _httpClient.GetAsync(url);
            
            // 3. 실패했으면 빈 리스트 반환
            if (!response.IsSuccessStatusCode)
            {
                return new List<SearchResult>();
            }

            // 4. 내용물(JSON) 읽기
            var jsonString = await response.Content.ReadAsStringAsync();
            var jsonNode = JsonNode.Parse(jsonString);

            // 5. JSON -> 내 그릇(SearchResult)에 옮겨 담기
            var results = new List<SearchResult>();
            var movies = jsonNode?["results"]?.AsArray(); // "results" 안에 목록이 들어있음

            if (movies != null)
            {
                foreach (var movie in movies)
                {
                    // 필요한 것만 쏙쏙 뽑아서 담기
                    var item = new SearchResult
                    {
                        Title = movie["title"]?.ToString() ?? "",
                        // 포스터가 있으면 앞에 주소 붙여주기 (TMDB 규칙)
                        ImageUrl = movie["poster_path"] != null 
                            ? $"https://image.tmdb.org/t/p/w200{movie["poster_path"]}" 
                            : null, 
                        ReleaseDate = movie["release_date"]?.ToString(),
                        Type = "Movie",
                        ExternalId = movie["id"]?.ToString() ?? "",
                        Author = movie["release_date"]?.ToString() ?? ""
                    };
                    results.Add(item);
                }
            }

            return results;
        }
    }
}