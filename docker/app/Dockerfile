# イメージを取得
FROM php:8.3.4-fpm

# PHPアプリケーションを内包したディレクトリをコピー
COPY src/ /var/www/html/

# PHP-FPM設定ファイルをコピー
COPY usr/local/etc/php/php.ini /usr/local/etc/php/

# パッケージやPHPの拡張モジュールをインストールするコマンドを実行
RUN apt-get update && apt-get install -y \
	git \
	curl \
	zip \
	lsof \
	unzip \
	&& docker-php-ext-install pdo_mysql mysqli

# AWS CLIのインストール
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
	&& unzip -q awscliv2.zip \
	&& ./aws/install

# コンテナのポートを開放
EXPOSE 9000

# ヘルスチェック
HEALTHCHECK --interval=5s --timeout=5s CMD lsof -i:9000 || exit 1

# 環境変数を設定
ENV TZ="Asia/Tokyo" LANG="ja_JP.UTF-8"

# 作業ディレクトリを"/var/www/html"に設定
WORKDIR /var/www/html
