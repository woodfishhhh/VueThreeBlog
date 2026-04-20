#!/usr/bin/env bash
# deploy.sh - 部署 VueCubeBlog 到京东云 VPS
# 用法: bash deploy/deploy.sh

set -e

REMOTE="root@36.151.148.198"
REMOTE_DIR="/opt/blog-stack/sites/newBlog"
CONTAINER="blog-nginx"

echo "==> 1. 构建项目..."
cd "$(dirname "$0")/.."
npm run build

echo "==> 2. 同步 dist/ 到 VPS..."
tar -C dist -czf - . | ssh -o StrictHostKeyChecking=no "$REMOTE" "rm -rf ${REMOTE_DIR}/* && tar -xzf - -C ${REMOTE_DIR}/"

echo "==> 3. 确认文件数量..."
ssh -o StrictHostKeyChecking=no "$REMOTE" "
  docker exec $CONTAINER sh -c '
    gz_count=\$(ls /usr/share/nginx/html/newBlog/assets/*.gz 2>/dev/null | wc -l)
    sw_exists=\$(ls /usr/share/nginx/html/newBlog/sw.js 2>/dev/null && echo yes || echo no)
    echo \"assets/*.gz: \$gz_count\"
    echo \"sw.js exists: \$sw_exists\"
  '
"

echo "==> 部署完成! https://36.151.148.198/newBlog/"