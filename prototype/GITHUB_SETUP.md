# GitHub에 새 저장소 생성 및 소스 업로드

현재 프로젝트는 연결된 GitHub 계정 `ShinDongus`의 기존 `haruhandang` 게임과 **무관한 독립 프로젝트**입니다. 새 저장소의 실제 생성·업로드가 완료되지 않았다면 완료되었다고 말하지 마십시오.

1. GitHub에서 https://github.com/new 를 열고, `onjeom` 또는 사용 가능한 독립 저장소 이름을 입력합니다.
2. 공개 여부는 개발 단계에서는 `Private`를 권장합니다. README, .gitignore, License 자동 생성 옵션은 선택하지 않은 **빈 저장소**로 만듭니다.
3. 프로젝트 압축을 풀고, `package.json`, `index.html`, `src`, `tests`, `README.md`, `AGENTS.md`, `CODEX_NEXT_PROMPT.md`가 저장소 루트에 들어가도록 다음을 실행합니다.

```bash
cd <압축해제한>/onjeom-codex-starter
git init
git branch -M main
git add .
git commit -m "feat: bootstrap Onjeom calm task and flower garden prototype"
git remote add origin https://github.com/ShinDongus/onjeom.git
git push -u origin main
```

`onjeom`이 아닌 이름으로 만들었다면 `git remote add origin` 주소를 실제 저장소 주소로 바꾸십시오. GitHub 인증은 본인 계정의 정상적인 Git 인증 방식을 사용합니다. 비밀번호나 토큰을 채팅에 공유하지 마십시오.

4. GitHub에 커밋이 나타나는지 확인한 후 Codex에서 해당 저장소를 열고 `CODEX_NEXT_PROMPT.md` 내용을 붙여넣습니다.

※ 저장소 생성 및 업로드를 현재 대화 도구에서 직접 수행할 수 없는 경우, 빈 저장소를 사용자가 만들면 이후 연결된 GitHub 도구로 파일 업로드를 이어갈 수 있습니다.
