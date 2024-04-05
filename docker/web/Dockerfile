FROM nginx:latest

COPY src/ /var/www/html/

COPY conf.d/default.conf /etc/nginx/templates/default.conf.template

RUN apt-get update && apt-get install -y \
        curl \
        git \
        unzip \
        zip

RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
        && unzip -q awscliv2.zip \
        && ./aws/install

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=5s CMD curl -f http://localhost/ || exit 1

ENV TZ="Asia/Tokyo" LANG="ja_JP.UTF-8"

WORKDIR /var/www/html
