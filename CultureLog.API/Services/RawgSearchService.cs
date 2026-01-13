using CultureLog.API.Models;
using Newtonsoft.Json.Linq;

namespace CultureLog.API.Services
{
    public class RawgSearchService : ISearchService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey = "dcb1473fb87644be9962961e4ca47488"; // 실제로는 appsettings.json에서 가져오는 게 정석!

        public RawgSearchService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<SearchResult>> SearchAsync(string query)
        {
            // RAWG API 호출
            var response = await _httpClient.GetStringAsync($"https://api.rawg.io/api/games?key={_apiKey}&search={query}&page_size=10");
            var json = JObject.Parse(response);
            var results = new List<SearchResult>();

            foreach (var item in json["results"])
            {
                var released = item["released"]?.ToString(); // 출시일
                var year = !string.IsNullOrEmpty(released) && released.Length >= 4 ? released.Substring(0, 4) : "";

                results.Add(new SearchResult
                {
                    Title = item["name"]?.ToString() ?? "",
                    ImageUrl = item["background_image"]?.ToString() ?? "", // 게임은 배경 이미지가 포스터 역할
                    Type = "game",
                    ExternalId = item["id"]?.ToString() ?? "",
                    Author = year // 게임은 작가 대신 '출시년도'를 보여줍시다
                });
            }

            return results;
        }
    }
}