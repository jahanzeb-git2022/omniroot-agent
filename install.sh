#!/bin/bash

# Create a temporary directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Download the necessary files
echo "Downloading installation files..."
curl -s -O https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/docker-compose.simple.yml
curl -s -O https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/easy-start.sh
chmod +x easy-start.sh

# Create installation directory
INSTALL_DIR="$HOME/agentic-dev-tool"
mkdir -p "$INSTALL_DIR"

# Move files to installation directory
mv docker-compose.simple.yml easy-start.sh "$INSTALL_DIR/"

# Create a symbolic link to the start script
mkdir -p "$HOME/.local/bin"
ln -sf "$INSTALL_DIR/easy-start.sh" "$HOME/.local/bin/agentic-dev-tool"

# Add to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
    export PATH="$HOME/.local/bin:$PATH"
fi

# Clean up
cd "$HOME"
rm -rf "$TMP_DIR"

echo "Installation complete!"
echo "You can now run the Agentic Dev Tool by typing:"
echo "agentic-dev-tool"
echo ""
echo "Or navigate to the installation directory and run:"
echo "cd $INSTALL_DIR"
echo "./easy-start.sh"
echo ""
echo "Would you like to start the application now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    cd "$INSTALL_DIR"
    ./easy-start.sh
else
    echo "You can start the application later by running 'agentic-dev-tool'"
fi