#!/bin/bash

# Automated AI Labor - Start Script
# This script launches the dev manager which handles both backend and frontend.

kill -9 $(lsof -t -i:8000) $(lsof -t -i:3000) $(lsof -t -i:3002) 2>/dev/null; pkill -f dev_manager.py; pkill -f uvicorn; pkill -f next-server; sleep 1

echo "🚀 Starting Automated AI Labor V2..."

nohup python3 dev_manager.py > logs/dev_manager.log 2>&1 &