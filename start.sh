#!/bin/bash

# Automated AI Labor - Start Script
# This script launches the dev manager which handles both backend and frontend.

# Automatically clear out zombie processes occupying the API ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
pkill -f dev_manager.py 2>/dev/null
pkill -f uvicorn 2>/dev/null
pkill -f next-server 2>/dev/null
sleep 1
echo "🚀 Starting Automated AI Labor V2..."

nohup python3 dev_manager.py > logs/dev_manager.log 2>&1 &