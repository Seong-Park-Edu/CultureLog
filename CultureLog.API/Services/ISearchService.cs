using CultureLog.API.Models;

namespace CultureLog.API.Services
{
    // [인터페이스] 검색 담당자라면 무조건 이 기능이 있어야 함!
    public interface ISearchService
    {
        // 입력(query)을 받으면 -> 결과 목록(List<SearchResult>)을 내놓아라.
        // Task: 시간이 좀 걸리니 기다려라 (비동기)
        Task<List<SearchResult>> SearchAsync(string query);
    }
}