#!/bin/bash

# Automated AI Labor - Start Script
# This script launches the dev manager which handles both backend and frontend.

pkill -f dev_manager.py; pkill -f uvicorn; pkill -f next-server; sleep 1

echo "🚀 Starting Automated AI Labor V2..."
nohup python3 dev_manager.py > logs/dev_manager.log 2>&1 &