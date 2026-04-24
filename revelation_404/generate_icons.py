from PIL import Image

def create_icon(size):
    try:
        # Load the newly generated logo image
        img = Image.open('assets/cute_seed_transparent.png')
        # Convert to RGBA to ensure alpha channel is handled if any, then resize
        img = img.convert('RGBA')
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save the icon
        img.save(f'icon-{size}x{size}.png')
        print(f"Created icon-{size}x{size}.png")
    except Exception as e:
        print(f"Error creating icon-{size}x{size}.png: {e}")

if __name__ == '__main__':
    create_icon(192)
    create_icon(512)
