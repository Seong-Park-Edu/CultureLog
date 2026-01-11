# 1. 빌드 단계 (공사장에서 재료 손질)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# 파일 복사
COPY . .

# 패키지 설치 및 빌드 (Release 모드로 압축)
RUN dotnet restore "CultureLog.API/CultureLog.API.csproj"
RUN dotnet publish "CultureLog.API/CultureLog.API.csproj" -c Release -o /app

# 2. 실행 단계 (완성된 건물만 남김)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# 포트 설정 (Render는 80번이나 8080을 좋아합니다)
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# 서버 실행 명령
ENTRYPOINT ["dotnet", "CultureLog.API.dll"]