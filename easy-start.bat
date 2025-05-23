@echo off
SETLOCAL

REM Check if Docker is installed
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
WHERE docker-compose >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

REM Set default Huggingface token if not provided
IF "%HUGGINGFACE_API_KEY%"=="" (
    echo HUGGINGFACE_API_KEY environment variable is not set.
    echo Using default token: YOUR_HUGGINGFACE_TOKEN
    SET HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_TOKEN
)

REM Check for other API keys
IF "%OPENAI_API_KEY%"=="" (
    echo OPENAI_API_KEY environment variable is not set.
    echo OpenAI models will not be available unless configured in the UI.
)

IF "%ANTHROPIC_API_KEY%"=="" (
    echo ANTHROPIC_API_KEY environment variable is not set.
    echo Anthropic models will not be available unless configured in the UI.
)

IF "%GOOGLE_API_KEY%"=="" (
    echo GOOGLE_API_KEY environment variable is not set.
    echo Google models will not be available unless configured in the UI.
)

REM Create directory for agent history
IF NOT EXIST "%USERPROFILE%\.agent_history" mkdir "%USERPROFILE%\.agent_history"

REM Pull the latest image
echo Pulling the latest Agentic Dev Tool image...
docker pull yourusername/agentic-dev-tool:latest

REM Start the container
echo Starting the Agentic Software-Development Tool...
docker-compose -f docker-compose.simple.yml up -d

IF %ERRORLEVEL% EQU 0 (
    echo Container started successfully!
    echo Access the web interface at http://localhost:3000
    echo Press Ctrl+C to stop viewing logs
    docker-compose -f docker-compose.simple.yml logs -f
) ELSE (
    echo Failed to start the container. Please check the error messages above.
    pause
    exit /b 1
)

ENDLOCAL