#!/usr/bin/env python3
"""
CSS Formatter Script
Formats minified CSS to readable vertical structure with proper indentation
"""

import re
import sys
import os

def format_css(css_content):
    """
    Format minified CSS to readable format with proper indentation
    """
    # Remove excessive whitespace but preserve structure
    css_content = re.sub(r'\s+', ' ', css_content.strip())
    
    # Add newlines after closing braces
    css_content = re.sub(r'}\s*', '}\n\n', css_content)
    
    # Add newlines after opening braces
    css_content = re.sub(r'{\s*', ' {\n', css_content)
    
    # Add newlines after semicolons (but not inside url() or other functions)
    css_content = re.sub(r';\s*(?![^()]*\))', ';\n', css_content)
    
    # Handle media queries properly
    css_content = re.sub(r'@media\s+([^{]+)\s*{\s*', r'@media \1 {\n', css_content)
    css_content = re.sub(r'@keyframes\s+([^{]+)\s*{\s*', r'@keyframes \1 {\n', css_content)
    css_content = re.sub(r'@font-face\s*{\s*', r'@font-face {\n', css_content)
    
    # Handle multiple selectors on same line
    css_content = re.sub(r',\s*(?![^()]*\))', ',\n', css_content)
    
    # Split into lines for indentation
    lines = css_content.split('\n')
    formatted_lines = []
    indent_level = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            formatted_lines.append('')
            continue
            
        # Decrease indent for closing braces
        if line.startswith('}'):
            indent_level = max(0, indent_level - 1)
        
        # Add indentation
        if line and not line.startswith('@') or line.startswith('@media') or line.startswith('@keyframes'):
            formatted_lines.append('    ' * indent_level + line)
        else:
            formatted_lines.append(line)
        
        # Increase indent for opening braces
        if line.endswith('{'):
            indent_level += 1
    
    # Clean up excessive empty lines
    result = '\n'.join(formatted_lines)
    result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)
    
    return result

def format_minified_sections(content):
    """
    Find and format remaining minified sections
    """
    # Pattern to find minified CSS (multiple properties on one line)
    minified_pattern = r'([^{\n}]*{[^}]*[;:][^}]*[;:][^}]*})'
    
    def format_match(match):
        css_block = match.group(1)
        # Only format if it looks minified (has multiple properties on one line)
        if css_block.count(';') > 1 and css_block.count('\n') < 2:
            return format_css(css_block)
        return css_block
    
    return re.sub(minified_pattern, format_match, content)

def main():
    # Get the CSS file path
    css_file = '/Users/sahaj/Downloads/saveweb2zip-com-www-itsoffbrand-com 2/css/offbrand-2023.shared.ce8dbabc0.min.css'
    
    if not os.path.exists(css_file):
        print(f"Error: CSS file not found at {css_file}")
        sys.exit(1)
    
    print("Reading CSS file...")
    
    # Read the current CSS content
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Original file size: {len(content)} characters")
    
    # Create backup
    backup_file = css_file + '.backup'
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Backup created: {backup_file}")
    
    print("Formatting CSS...")
    
    # Format the CSS
    formatted_content = format_minified_sections(content)
    
    # Additional cleanup for specific patterns
    formatted_content = format_css(formatted_content)
    
    print(f"Formatted file size: {len(formatted_content)} characters")
    
    # Write the formatted content
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(formatted_content)
    
    print("✅ CSS formatting complete!")
    print(f"Original file backed up to: {backup_file}")
    print(f"Formatted file saved to: {css_file}")

if __name__ == "__main__":
    main()