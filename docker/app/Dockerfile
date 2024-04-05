FROM php:8.3.4-fpm

COPY src/ /var/www/html/

COPY usr/local/etc/php/php.ini /usr/local/etc/php/

RUN apt-get update && apt-get install -y \
	curl \
	git \
 	lsof \
	unzip \
 	zip \
	&& docker-php-ext-install pdo_mysql mysqli

RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
	&& unzip -q awscliv2.zip \
	&& ./aws/install

EXPOSE 9000

HEALTHCHECK --interval=5s --timeout=5s CMD lsof -i:9000 || exit 1

ENV TZ="Asia/Tokyo" LANG="ja_JP.UTF-8"

WORKDIR /var/www/html
