#!/bin/bash
cd /home/kavia/workspace/code-generation/colorful-to-do-planner-25301-25310/todo_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

