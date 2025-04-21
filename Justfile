build:
    #!/usr/bin/env -S bash -eu
    echo -e "\033[1;34m🚀 Starting build process...\033[0m"
    echo -e "\033[1;33m📦 Installing dependencies...\033[0m"
    pnpm install
    echo -e "\033[1;35m🗑️  Cleaning up dist directory...\033[0m"
    rm -rf dist
    mkdir -p dist

    echo -e "\033[1;36m📜 Logging build information...\033[0m"
    echo "Build started at: $(date)"
    echo "Bun version: $(bun --version)"

    echo -e "\033[1;36m📊 Listing contents of dist directory...\033[0m"
    ls -lhA dist

    echo -e "\033[1;32m🏗️  Building project...\033[0m"
    DEBUG='*' bun build --compile src/index.js --bytecode --outfile dist/home-drawio

    echo -e "\033[1;33m🚀 Running the native executable...\033[0m"
    DRAWIO_DEBUG=1 dist/home-drawio convert ./sample.drawio
    echo -e "\033[1;32m✅ Build process completed successfully!\033[0m"
    echo -e "\033[1;36m📊 Checking binary size...\033[0m"
    ls -lh dist/home-drawio
    file dist/home-drawio
    echo -e "\033[1;36m📊 Checking xz compressed binary size...\033[0m"
    xz -2 -T0 -c dist/home-drawio > dist/home-drawio.xz
    ls -lh dist/home-drawio.xz
    rm dist/home-drawio.xz
    echo -e "\033[1;36m🔍 Checking binary dependencies...\033[0m"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        otool -L dist/home-drawio
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        ldd dist/home-drawio
    else
        echo "Unsupported operating system for dependency check."
    fi
    rm -f .*.bun-build
