# Docling is disabled on this system (requires PyTorch which is not compatible with x86_64 Mac)
# Document parsing (PDF, DOCX, PPTX) will not work, but presentation generation will.

class DoclingService:
    def __init__(self):
        pass

    def parse_to_markdown(self, file_path: str) -> str:
        raise NotImplementedError(
            "Document parsing is disabled. Docling requires PyTorch which is not available on this system. "
            "Please use text input instead of file uploads, or run with Docker."
        )
