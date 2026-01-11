using System.Text.Json.Nodes;
using CultureLog.API.Models;

namespace CultureLog.API.Services
{
    public class NaverSearchService : ISearchService
    {
        private readonly HttpClient _httpClient;
        private readonly string _clientId;
        private readonly string _clientSecret;

        public NaverSearchService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _clientId = config["ApiKeys:NaverClientId"]!;
            _clientSecret = config["ApiKeys:NaverClientSecret"]!;
        }

        public async Task<List<SearchResult>> SearchAsync(string query)
        {
            // 1. 네이버 요청 주소 (책 검색)
            var url = $"https://openapi.naver.com/v1/search/book.json?query={query}&display=10";

            // 2. [중요] 네이버는 헤더(Header)에 신분증을 제시해야 함
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("X-Naver-Client-Id", _clientId);
            request.Headers.Add("X-Naver-Client-Secret", _clientSecret);

            // 3. 요청 보내기
            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode) return new List<SearchResult>();

            // 4. 결과 받아서 포장하기
            var jsonString = await response.Content.ReadAsStringAsync();
            var jsonNode = JsonNode.Parse(jsonString);
            var results = new List<SearchResult>();

            var books = jsonNode?["items"]?.AsArray(); // 네이버는 "items"에 담겨옴

            if (books != null)
            {
                foreach (var book in books)
                {
                    results.Add(new SearchResult
                    {
                        Title = book["title"]?.ToString().Replace("<b>", "").Replace("</b>", "") ?? "", // 검색어 강조 태그 제거
                        ImageUrl = book["image"]?.ToString(),
                        ReleaseDate = book["pubdate"]?.ToString(),
                        Type = "Book", // 타입은 책!
                        ExternalId = book["isbn"]?.ToString() ?? "" // 책은 ISBN이 고유 번호
                    });
                }
            }

            return results;
        }
    }
}