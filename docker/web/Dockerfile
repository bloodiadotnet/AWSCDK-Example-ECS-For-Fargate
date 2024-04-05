# イメージを取得
FROM nginx:latest

# ダミーPHPアプリケーションを内包したディレクトリをコピー
COPY src/ /var/www/html/

# nginx設定ファイルをコピー
COPY conf.d/default.conf /etc/nginx/templates/default.conf.template

# パッケージやPHPの拡張モジュールをインストールするコマンドを実行
RUN apt-get update && apt-get install -y \
        git \
        curl \
        zip \
        unzip

# AWS CLIのインストール
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
        && unzip -q awscliv2.zip \
        && ./aws/install

# コンテナのポートを開放
EXPOSE 80

# ヘルスチェック
HEALTHCHECK --interval=5s --timeout=5s CMD curl -f http://localhost/ || exit 1

# 環境変数を設定
ENV TZ="Asia/Tokyo" LANG="ja_JP.UTF-8"

# 作業ディレクトリを"/var/www/html"に設定
WORKDIR /var/www/html
