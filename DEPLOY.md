# 部署指南 - IELTS Speaking AI Practice App

本文档介绍如何将项目部署到生产环境。

---

## 📋 部署架构总览

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (反向代理)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
     ┌────────▼────────┐     ┌─────────▼─────────┐
     │  Frontend 静态文件 │     │  Backend (FastAPI) │
     │  (Nginx 直接托管)  │     │  Gunicorn/Uvicorn  │
     └─────────────────┘     │  + SQLite          │
                              └───────────────────┘
```

---

## 方案一：单服务器部署（推荐入门）

适合个人使用或小规模部署，前后端都部署在同一台服务器上。

### 1. 服务器环境准备

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx nodejs npm

# 确认版本
node -v     # >= 18
python3 --version  # >= 3.9
```

### 2. 获取代码

```bash
cd /opt
git clone <your-repo-url> ielts-speak-learning
cd ielts-speak-learning
```

### 3. 构建前端

```bash
cd frontend
npm install
npm run build
# 构建产物在 frontend/dist/ 目录
```

### 4. 配置后端

```bash
cd /opt/ielts-speak-learning/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装生产级 ASGI 服务器
pip install gunicorn
```

### 5. 创建 Systemd 服务（后端自启动）

```bash
sudo tee /etc/systemd/system/ielts-backend.service > /dev/null << 'EOF'
[Unit]
Description=IELTS Speaking Practice Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/ielts-speak-learning/backend
Environment="PATH=/opt/ielts-speak-learning/backend/venv/bin:/usr/bin"
ExecStart=/opt/ielts-speak-learning/backend/venv/bin/gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 2 \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/ielts-backend-access.log \
    --error-logfile /var/log/ielts-backend-error.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 设置目录权限
sudo chown -R www-data:www-data /opt/ielts-speak-learning/backend/data

# 启动并设置开机自启
sudo systemctl daemon-reload
sudo systemctl enable ielts-backend
sudo systemctl start ielts-backend

# 查看状态
sudo systemctl status ielts-backend
```

### 6. 配置 Nginx

```bash
sudo tee /etc/nginx/sites-available/ielts-speak > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 前端静态文件
    root /opt/ielts-speak-learning/frontend/dist;
    index index.html;

    # 前端 SPA 路由 - 所有非 API、非静态文件的请求都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 支持长时间 LLM 请求
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    # 后端 API 文档（可选，生产环境可删除）
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
    location /redoc {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # 静态资源缓存
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/ielts-speak /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 配置 HTTPS（推荐）

```bash
# 使用 Certbot + Let's Encrypt 免费证书
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 证书会自动续期
```

---

## 方案二：Docker 部署

### 1. 创建 Backend Dockerfile

在 `backend/` 目录下创建 `Dockerfile`：

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000"]
```

### 2. 创建 Frontend Dockerfile

在 `frontend/` 目录下创建 `Dockerfile`：

```dockerfile
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

在 `frontend/` 目录下创建 `nginx.conf`：

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_read_timeout 120s;
    }
}
```

### 3. 创建 docker-compose.yml

在项目根目录创建：

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    volumes:
      - backend-data:/app/data
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  backend-data:
```

### 4. 启动

```bash
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

## 方案三：云平台部署

### Vercel (前端) + Railway (后端)

**前端 → Vercel：**
1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 设置 Root Directory 为 `frontend`
4. Framework Preset 选 `Vite`
5. 在 Environment Variables 中添加后端地址（如果 API 路径需要修改）

**后端 → Railway：**
1. 在 [railway.app](https://railway.app) 新建项目
2. 连接 GitHub 仓库
3. 设置 Root Directory 为 `backend`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. 添加 Persistent Volume 挂载到 `/app/data`（用于 SQLite 持久化）

> ⚠️ **注意：** 使用此方案需要修改前端 `api.js` 中的 `API_BASE` 为后端的完整 URL。

---

## 🔒 生产环境安全清单

- [ ] **启用 HTTPS** — 使用 Let's Encrypt 或云平台提供的 SSL
- [ ] **限制 CORS** — 修改 `backend/app/main.py` 中的 `allow_origins`，仅允许你的域名
- [ ] **关闭 API 文档** — 生产环境中设置 `docs_url=None, redoc_url=None`
- [ ] **定期备份数据库** — 定期备份 `backend/data/questions.db`
- [ ] **设置防火墙** — 仅开放 80/443 端口，内部服务不暴露
- [ ] **监控日志** — 配置日志收集和报警

### 修改 CORS（生产环境）

编辑 `backend/app/main.py`：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.com",  # 替换为你的实际域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 关闭 API 文档（生产环境）

```python
app = FastAPI(
    title="IELTS Speaking AI Practice",
    docs_url=None,      # 关闭 Swagger
    redoc_url=None,      # 关闭 ReDoc
)
```

---

## 📊 性能优化建议

| 优化项 | 说明 |
|--------|------|
| **Nginx Gzip** | 已在配置中启用，压缩 JS/CSS/JSON |
| **静态资源缓存** | Vite 构建自动带 hash，配合 Nginx `expires 30d` |
| **数据库升级** | 如果并发量大，将 SQLite 替换为 PostgreSQL |
| **CDN** | 将前端静态资源放到 CDN（如 CloudFlare、阿里云 CDN） |
| **Worker 数量** | Gunicorn workers 建议设为 `CPU核心数 * 2 + 1` |

---

## 🔄 更新部署

### 单服务器更新

```bash
cd /opt/ielts-speak-learning
git pull

# 更新前端
cd frontend
npm install
npm run build

# 更新后端
cd ../backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ielts-backend

# Nginx 不需要重启（静态文件已更新）
```

### Docker 更新

```bash
git pull
docker-compose up -d --build
```

---

## 📁 数据备份

数据库文件位于 `backend/data/questions.db`，建议定期备份：

```bash
# 手动备份
cp backend/data/questions.db backup/questions_$(date +%Y%m%d).db

# 定时备份 (crontab)
# 每天凌晨 2 点备份
0 2 * * * cp /opt/ielts-speak-learning/backend/data/questions.db /backup/questions_$(date +\%Y\%m\%d).db
```
