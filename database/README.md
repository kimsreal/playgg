# 운영 환경의 계정 설정

1. 사용할 MariaDB 데이터베이스를 만들고 관리자 계정으로 [accounts.sql](accounts.sql)을 적용합니다.
2. 운영 서버 프로젝트의 `config/cf-playground.sample.php`를 같은 위치의 `config/cf-playground.php`로 복사합니다. `host`, `port`, `database`, `username`, `password`를 채웁니다. 실제 설정 파일은 Git에서 제외됩니다.
3. PHP 7.4에서 `pdo_mysql`과 세션을 활성화하고, HTTPS로 접속합니다. Apache에서 `config/`와 `database/`의 HTTP 접근은 차단합니다. PHP 프로세스에는 설정 파일 읽기 권한이 필요합니다.

앱 실행 계정에는 `playground_users`의 SELECT·INSERT, `playground_user_settings`의 SELECT·INSERT·UPDATE, `playground_auth_attempts`의 SELECT·INSERT·UPDATE·DELETE 권한이 필요합니다. 테이블 생성은 관리자 계정으로 별도로 진행합니다.

가입 시 이메일, 이름, 암호 해시가 사용자 테이블에 저장됩니다. 별도 설정 테이블에는 반려동물 정보와 아바타 설정, 마지막으로 선택한 반려동물, 시점, 주인 아바타 선택이 저장됩니다. 사진과 사진 기록은 사용하는 브라우저에 저장됩니다.
