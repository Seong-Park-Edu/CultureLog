using CultureLog.API.Services;

var builder = WebApplication.CreateBuilder(args);

// [1] 서비스 등록 (재료 준비)
// ---------------------------------------------------------

// 1. 컨트롤러 기능 켜기 (이게 있어야 Controllers 폴더를 인식합니다!)
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    // 순환 참조 문제(A가 B를 가리키고 B가 A를 가리키는 상황) 해결 옵션
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});

// 2. Swagger(API 문서) 생성 도구 등록
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. HttpClient 등록
builder.Services.AddHttpClient();

// 7. ▼▼▼ [중요] CORS 설정 추가: "리액트(5173)의 접근을 허용한다" ▼▼▼
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin() // "누구든지 환영해!" (Vercel 포함)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// ▲▲▲ ---------------------------------------------------- ▲▲▲

// 6. ▼▼▼ [Supabase 연결 설정 추가] ▼▼▼
builder.Services.AddScoped<Supabase.Client>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var url = config["ApiKeys:SupabaseUrl"]!;
    var key = config["ApiKeys:SupabaseKey"]!;

    // Supabase 옵션 설정
    var options = new Supabase.SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = true
    };

    // 클라이언트 생성 및 초기화
    var client = new Supabase.Client(url, key, options);
    client.InitializeAsync().Wait(); // 연결될 때까지 잠시 대기

    return client;
});
// ▲▲▲ ----------------------- ▲▲▲

// // 4. 우리가 만든 검색 일꾼(Service) 등록
// builder.Services.AddScoped<ISearchService, TmdbSearchService>();

// // 5. 새로운 네이버 일꾼도 등록!
// builder.Services.AddScoped<ISearchService, NaverSearchService>();

// // 7. 새로운 RAWG 일꾼도 등록!
// builder.Services.AddScoped<ISearchService, RawgSearchService>();

// 4. TMDB (영화)
builder.Services.AddHttpClient<TmdbSearchService>();

// 5. Naver (도서/웹툰)
builder.Services.AddHttpClient<NaverSearchService>();

// 7. RAWG (게임)
builder.Services.AddHttpClient<RawgSearchService>();


// ---------------------------------------------------------

var app = builder.Build();

// [2] 파이프라인 설정 (손님 응대 순서)
// ---------------------------------------------------------

app.UseSwagger();
app.UseSwaggerUI();


// ▼▼▼ [중요] CORS 정책 적용 (순서 중요! UseAuthorization 위에 있어야 함) ▼▼▼
//app.UseCors("AllowReact"); //개발에서는 이거 사용
app.UseCors("AllowAll");

// ▲▲▲ ---------------------------------------------------------------- ▲▲▲

//배포 환경에서는 주석처리
//app.UseHttpsRedirection();

app.UseAuthorization();

// [중요] 컨트롤러들을 주소와 연결해라 (이게 핵심!)
app.MapControllers();

app.Run();