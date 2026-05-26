#!/bin/bash

# Lady's Essence Mobile Build & Deployment Script
# This script handles building and deploying iOS and Android apps

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
ANDROID_DIR="$FRONTEND_DIR/android"
IOS_DIR="$FRONTEND_DIR/ios/App"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

show_help() {
  cat << EOF
Lady's Essence Mobile Build Script

Usage: $0 <command> [options]

Commands:
  setup               Setup development environment
  build-web           Build web app
  build-android       Build Android APK/AAB
  build-ios           Build iOS IPA
  dev-android         Build web and open Android in Android Studio
  dev-ios             Build web and open iOS in Xcode
  install-android     Install APK on connected device/emulator
  clean               Clean all build artifacts
  help                Show this help message

Examples:
  $0 setup                    # Initial setup
  $0 build-web                # Build web app
  $0 build-android debug      # Build Android debug APK
  $0 build-android release    # Build Android release AAB
  $0 build-ios debug          # Build iOS debug
  $0 build-ios release        # Build iOS release

Environment Variables:
  ANDROID_KEYSTORE_PATH      Path to Android keystore file
  ANDROID_KEYSTORE_PASSWORD  Keystore password
  IOS_TEAM_ID                Apple Team ID for signing

EOF
}

# Command: Setup
cmd_setup() {
  print_header "Setting up Lady's Essence Mobile Development"

  cd "$FRONTEND_DIR"

  # Install dependencies
  print_info "Installing npm dependencies..."
  npm install

  # Build web app
  print_info "Building web app..."
  npm run build

  # Sync to platforms
  print_info "Syncing to platforms..."
  npx cap sync

  # Check for required tools
  print_info "Checking for required tools..."

  if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    print_success "Java found: $JAVA_VERSION"
  else
    print_error "Java not found. Please install JDK 17+"
  fi

  if command -v gradle &> /dev/null; then
    print_success "Gradle found"
  else
    print_error "Gradle not found (will use gradlew)"
  fi

  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v xcode-select &> /dev/null; then
      print_success "Xcode found"
    else
      print_error "Xcode not found. Please install Xcode"
    fi

    if command -v pod &> /dev/null; then
      print_success "CocoaPods found"
    else
      print_error "CocoaPods not found. Install: sudo gem install cocoapods"
    fi
  fi

  print_success "Setup complete!"
  echo ""
  print_info "Next steps:"
  echo "  1. For Android: $0 dev-android"
  echo "  2. For iOS: $0 dev-ios"
}

# Command: Build Web
cmd_build_web() {
  print_header "Building Web App"

  cd "$FRONTEND_DIR"
  npm run build

  print_success "Web app built successfully!"
  echo "Output: $FRONTEND_DIR/dist"
}

# Command: Build Android
cmd_build_android() {
  local BUILD_TYPE=${1:-debug}

  print_header "Building Android - $BUILD_TYPE"

  cd "$FRONTEND_DIR"

  # Build web first
  print_info "Building web app..."
  npm run build

  # Sync
  print_info "Syncing to Android..."
  npx cap sync android

  # Build
  cd "$ANDROID_DIR"

  if [ "$BUILD_TYPE" = "debug" ]; then
    print_info "Building debug APK..."
    ./gradlew clean assembleDebug
    print_success "Debug APK ready!"
    echo "Location: $ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
  elif [ "$BUILD_TYPE" = "release" ]; then
    print_info "Building release AAB..."

    if [ -z "$ANDROID_KEYSTORE_PATH" ]; then
      print_error "ANDROID_KEYSTORE_PATH not set"
      echo "Set keystore path: export ANDROID_KEYSTORE_PATH=/path/to/keystore.jks"
      return 1
    fi

    # Configure signing in build.gradle
    ./gradlew clean bundleRelease

    print_success "Release AAB ready!"
    echo "Location: $ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
  else
    print_error "Invalid build type. Use 'debug' or 'release'"
    return 1
  fi
}

# Command: Build iOS
cmd_build_ios() {
  local BUILD_TYPE=${1:-debug}

  if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "iOS build requires macOS"
    return 1
  fi

  print_header "Building iOS - $BUILD_TYPE"

  cd "$FRONTEND_DIR"

  # Build web first
  print_info "Building web app..."
  npm run build

  # Sync
  print_info "Syncing to iOS..."
  npx cap sync ios

  # Install pods
  cd "$IOS_DIR"
  print_info "Installing CocoaPods..."
  pod install

  # Build
  if [ "$BUILD_TYPE" = "debug" ]; then
    print_info "Building debug..."
    xcodebuild \
      -workspace App.xcworkspace \
      -scheme App \
      -configuration Debug \
      -derivedDataPath build
    print_success "Debug build complete!"
  elif [ "$BUILD_TYPE" = "release" ]; then
    print_info "Building release..."
    xcodebuild \
      -workspace App.xcworkspace \
      -scheme App \
      -configuration Release \
      -archivePath build/App.xcarchive \
      archive

    print_success "Release archive created!"
    echo "Location: $IOS_DIR/build/App.xcarchive"
  else
    print_error "Invalid build type. Use 'debug' or 'release'"
    return 1
  fi
}

# Command: Dev Android
cmd_dev_android() {
  print_header "Building for Android Development"

  cmd_build_web

  print_info "Opening Android Studio..."
  cd "$ANDROID_DIR"

  if command -v open &> /dev/null; then
    # macOS
    open -a "Android Studio" .
  elif command -v explorer &> /dev/null; then
    # Windows
    explorer .
  else
    print_info "Opening $ANDROID_DIR"
    cd "$ANDROID_DIR"
  fi
}

# Command: Dev iOS
cmd_dev_ios() {
  if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "iOS development requires macOS"
    return 1
  fi

  print_header "Building for iOS Development"

  cmd_build_web

  print_info "Syncing to iOS..."
  cd "$FRONTEND_DIR"
  npx cap sync ios

  # Install pods
  cd "$IOS_DIR"
  print_info "Installing CocoaPods..."
  pod install

  print_info "Opening Xcode..."
  open App.xcworkspace

  print_success "Xcode opened! Select a device/simulator and press Play (or Cmd+R)"
}

# Command: Install Android
cmd_install_android() {
  print_header "Installing Android APK"

  local APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"

  if [ ! -f "$APK_PATH" ]; then
    print_error "APK not found at $APK_PATH"
    print_info "Build first: $0 build-android debug"
    return 1
  fi

  if ! command -v adb &> /dev/null; then
    print_error "adb not found. Add Android SDK tools to PATH"
    return 1
  fi

  # List devices
  echo ""
  print_info "Connected devices:"
  adb devices

  echo ""
  read -p "Install on default device? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing APK..."
    adb install -r "$APK_PATH"
    print_success "Installation complete!"

    echo ""
    read -p "Launch app? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      adb shell am start -n com.ladysessence.mobile/.MainActivity
    fi
  fi
}

# Command: Clean
cmd_clean() {
  print_header "Cleaning build artifacts"

  print_info "Cleaning web..."
  cd "$FRONTEND_DIR"
  rm -rf dist

  print_info "Cleaning Android..."
  cd "$ANDROID_DIR"
  ./gradlew clean

  if [[ "$OSTYPE" == "darwin"* ]]; then
    print_info "Cleaning iOS..."
    cd "$IOS_DIR"
    rm -rf build Pods Podfile.lock
  fi

  print_success "Clean complete!"
}

# Main
main() {
  local COMMAND=${1:-help}

  case "$COMMAND" in
    setup)        cmd_setup ;;
    build-web)    cmd_build_web ;;
    build-android) cmd_build_android "$2" ;;
    build-ios)    cmd_build_ios "$2" ;;
    dev-android)  cmd_dev_android ;;
    dev-ios)      cmd_dev_ios ;;
    install-android) cmd_install_android ;;
    clean)        cmd_clean ;;
    help|--help|-h) show_help ;;
    *)
      print_error "Unknown command: $COMMAND"
      show_help
      exit 1
      ;;
  esac
}

main "$@"
