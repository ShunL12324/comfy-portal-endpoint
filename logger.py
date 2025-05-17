import logging

def get_logger(name='comfy-portal'):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid adding handlers if they already exist
    if not logger.handlers:
        # Create console handler with formatting
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter('[comfy-portal-endpoint] [%(levelname)s] [%(filename)s:%(lineno)d] %(message)s')
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger 