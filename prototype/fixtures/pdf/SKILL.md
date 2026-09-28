---
name: pdf
description: Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms.
license: Proprietary. LICENSE.txt has complete terms
---

# PDF Processing (excerpt)

## Overview
This skill covers reading, generating, editing, and manipulating PDFs. Use when
the user asks to extract text or tables from a PDF, merge or split documents,
fill forms, or create new PDFs.

## Extract text
Use pdfplumber for text and table extraction:

```python
import pdfplumber
with pdfplumber.open("doc.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Forms
Fill AcroForm fields with pypdf, flattening after write.
