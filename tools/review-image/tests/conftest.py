import os

# Tests must stay offline and must not download rembg models.
os.environ.setdefault('REVIEW_IMAGE_FORCE_OPENCV', '1')
