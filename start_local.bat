@echo off
cd /d %~dp0
echo ========================================================
echo  MEC ローカルプレビューサーバーを起動中...
echo  URL: http://localhost:8000/index.html
echo  ※ 終了するにはこの画面を閉じるか Ctrl+C を押してください
echo ========================================================
start http://localhost:8000/index.html
python -m http.server 8000
