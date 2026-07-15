# Bible Book Upload Guide

## Overview
The RPV Bible app can automatically parse and import Bible books from **PDF** or **DOCX** files. The parser intelligently detects chapters and verses using pattern matching.

---

## 📁 Supported File Formats

- ✅ **PDF** (`.pdf`)
- ✅ **DOCX** (`.docx`) - Microsoft Word documents

---

## 🚀 How to Upload

1. **Login as Admin** - Navigate to `/admin` page
2. **Fill in the form:**
   - **Translation ID**: Unique identifier (e.g., `pidgin-bible`, `NIV`, `KJV`)
   - **Translation Name**: Display name (e.g., `Pidgin Bible`, `New International Version`)
   - **Book Name**: Name of the book (e.g., `John`, `Matthew`, `Genesis`)
3. **Select your file** (PDF or DOCX)
4. **Click "Upload & Parse Document"**
5. Wait for parsing to complete (you'll see progress updates)
6. Success! The book is now saved to Firestore

---

## 📝 Document Formatting Guidelines

### ✅ REQUIRED Format

Your document **must** follow these patterns for successful parsing:

### 1. **Chapter Markers**

The parser recognizes these chapter patterns (case-insensitive):

```
Chapter 1
CHAPTER 1
TITUS 1
John 1
1
1:
```

**Examples:**
```
Chapter 1
(followed by verses)

or

1
(followed by verses)

or

JOHN 1
(followed by verses)
```

### 2. **Verse Markers**

Each verse must start with its number followed by a separator. Supported formats:

```
1. Verse text here
1: Verse text here
1 Verse text here
1Verse text here (no space)
```

**Examples:**
```
1 In the beginning was the Word, and the Word was with God, and the Word was God.
2. The same was in the beginning with God.
3: All things were made by him; and without him was not any thing made that was made.
```

### 3. **Multi-line Verses**

Verses can span multiple lines. The parser will continue reading until it finds the next verse number:

```
1 For God so loved the world, that he gave his only begotten Son, 
that whosoever believeth in him should not perish, 
but have everlasting life.
2 For God sent not his Son into the world to condemn the world; 
but that the world through him might be saved.
```

---

## 📋 Document Structure Examples

### ✅ **Example 1: Simple Format**

```
Chapter 1

1 In the beginning God created the heaven and the earth.
2 And the earth was without form, and void; and darkness was upon the face of the deep.
3 And the Spirit of God moved upon the face of the waters.

Chapter 2

1 Thus the heavens and the earth were finished, and all the host of them.
2 And on the seventh day God ended his work which he had made.
```

### ✅ **Example 2: Compact Format**

```
1

1. In the beginning was the Word, and the Word was with God, and the Word was God.
2. The same was in the beginning with God.
3. All things were made by him; and without him was not any thing made that was made.

2

1. And the light shineth in darkness; and the darkness comprehended it not.
```

### ✅ **Example 3: Book Name Format**

```
JOHN 1

1 In the beginning was the Word, and the Word was with God, and the Word was God.
2 The same was in the beginning with God.
3 All things were made by him; and without him was not any thing made that was made.

JOHN 2

1 And the third day there was a marriage in Cana of Galilee.
```

### ✅ **Example 4: No Explicit Chapter Markers**

If your document starts directly with verse 1, the parser will automatically create Chapter 1:

```
1 In the beginning God created the heaven and the earth.
2 And the earth was without form, and void.
3 And the Spirit of God moved upon the face of the waters.
```

---

## ⚠️ Common Issues & Solutions

### ❌ **Issue: No chapters found**

**Problem:** Document doesn't follow any recognized pattern.

**Solution:** 
- Ensure chapter markers are on their own line or clearly separated
- Use one of the supported chapter formats (Chapter 1, 1, BOOK 1, etc.)
- Make sure verse numbers are at the start of lines

### ❌ **Issue: Verses merged together**

**Problem:** Parser can't distinguish between verses.

**Solution:**
- Ensure each verse starts with a verse number
- Use proper separators (space, period, colon)
- Example: `1 Text` or `1. Text` or `1: Text`

### ❌ **Issue: Chapter markers treated as verses**

**Problem:** Numbers meant to be chapters are parsed as verses.

**Solution:**
- Put chapter markers on their own line
- Don't add text immediately after chapter numbers on the same line
- Add a blank line after chapter markers

### ❌ **Issue: Verses contain verse numbers from other verses**

**Problem:** Multi-line verses where subsequent lines start with numbers.

**Solution:**
- Avoid starting continuation lines with numbers
- Or ensure verse numbers are sequential (parser detects sequential patterns)

---

## 🎯 Best Practices

### ✅ **DO:**
1. **Use one book per file** - Upload Matthew.pdf, Mark.pdf, etc. separately
2. **Clear chapter markers** - Use "Chapter 1" or standalone "1" on separate lines
3. **Consistent verse numbering** - Start each verse with its number
4. **Clean formatting** - Remove headers, footers, page numbers from the text
5. **Sequential numbering** - Use 1, 2, 3, 4... in order
6. **Test with one chapter first** - Upload a single chapter to test formatting

### ❌ **DON'T:**
1. **Mix multiple books** - Don't combine Genesis and Exodus in one file
2. **Include commentary** - Remove study notes, cross-references, annotations
3. **Use footnote numbers as verses** - Footnote markers (¹, ², ³) will confuse the parser
4. **Include headers/footers** - Remove book titles, page numbers from each page
5. **Use complex formatting** - Avoid tables, columns, or complex layouts
6. **Mix chapter numbering styles** - Be consistent (either "Chapter 1" or "1" throughout)

---

## 📊 Supported Patterns Summary

| Pattern Type | Examples | Notes |
|-------------|----------|-------|
| **Chapter** | `Chapter 1`, `CHAPTER 1` | Case-insensitive |
| **Chapter** | `1`, `1:` | Standalone numbers |
| **Chapter** | `JOHN 1`, `TITUS 1` | Book name + number |
| **Verse** | `1 Text`, `1. Text`, `1: Text` | Must start line |
| **Verse** | `1Text` | No space (flexible) |

---

## 🔍 What Happens During Parsing

1. **Text Extraction** 
   - PDF: Extracts text from all pages using PDF.js
   - DOCX: Extracts raw text using Mammoth

2. **Chapter Detection**
   - Looks for chapter markers using multiple patterns
   - Creates chapters in sequential order
   - Auto-creates Chapter 1 if document starts with verses

3. **Verse Detection**
   - Identifies verse numbers at line starts
   - Handles multi-line verses intelligently
   - Continues accumulating text until next verse number

4. **Validation**
   - Logs chapter count and verse count
   - Displays results in console for debugging
   - Shows success message with statistics

5. **Storage**
   - Merges with existing translation (updates/adds)
   - Saves to Firestore database
   - Accessible immediately after upload

---

## 💡 Tips for Different Bible Formats

### **For Single-Chapter Books (Philemon, Jude, etc.)**
```
1 Paul, a prisoner of Jesus Christ...
2 I thank my God...
```
*Parser will auto-create Chapter 1*

### **For Books with Many Chapters (Psalms, Genesis, etc.)**
```
Chapter 1

1 Blessed is the man that walketh not in the counsel of the ungodly...

Chapter 2

1 Why do the heathen rage, and the people imagine a vain thing?
```

### **For Epistles (Romans, Corinthians, etc.)**
```
ROMANS 1

1 Paul, a servant of Jesus Christ...
2 Which he had promised afore by his prophets...

ROMANS 2

1 Therefore thou art inexcusable, O man...
```

---

## 🛠️ Testing Your Format

### Quick Test Checklist

Before uploading a full book, test with this sample:

```
Chapter 1

1 This is verse one of chapter one.
2 This is verse two of chapter one.
3 This is verse three which spans
multiple lines to test the parser.

Chapter 2

1 This is verse one of chapter two.
2 This is verse two of chapter two.
```

**Expected Result:**
- 2 chapters
- 3 verses in chapter 1
- 2 verses in chapter 2
- Total: 5 verses

---

## 📧 Example Upload Session

### Step 1: Prepare Your Document

**Filename:** `John.docx` or `John.pdf`

**Content:**
```
Chapter 1

1 In the beginning was the Word, and the Word was with God, and the Word was God.
2 The same was in the beginning with God.
3 All things were made by him; and without him was not any thing made that was made.
4 In him was life; and the life was the light of men.
5 And the light shineth in darkness; and the darkness comprehended it not.

Chapter 2

1 And the third day there was a marriage in Cana of Galilee.
2 And both Jesus was called, and his disciples, to the marriage.
```

### Step 2: Fill Upload Form

- **Translation ID:** `kjv`
- **Translation Name:** `King James Version`
- **Book Name:** `John`
- **File:** `John.docx`

### Step 3: Upload & Parse

Click "Upload & Parse Document" and wait for:
```
✓ Extracting text from DOCX...
✓ Parsing chapters and verses...
✓ Importing translation...
✓ Saving to Firestore...
✓ Complete!
```

### Step 4: Success Message

```
Document uploaded and parsed successfully!

Found 2 chapter(s) with 7 verse(s).

Translation saved to Firestore and will persist after refresh.
```

---

## 🐛 Troubleshooting

### If parsing fails:

1. **Check Console** (F12 in browser)
   - Look for parsing logs
   - See which chapters/verses were found

2. **Verify Format**
   - Open your document
   - Check chapter markers
   - Check verse numbering
   - Look for special characters

3. **Simplify**
   - Remove formatting (bold, italic, etc.)
   - Remove footnotes and annotations
   - Use plain text format

4. **Test Small**
   - Upload just one chapter first
   - If it works, upload remaining chapters

5. **Check File Type**
   - Ensure file is actual PDF or DOCX
   - Not a renamed text file
   - Not password protected

---

## 📞 Need Help?

If you're having trouble with a specific format:

1. Check the browser console (F12) for detailed parsing logs
2. Try the alternative format examples above
3. Upload one chapter at a time to isolate issues
4. Ensure your file is properly formatted as PDF or DOCX

---

## ✅ Success Indicators

You'll know the upload worked when:

- ✓ You see "Complete!" in the progress message
- ✓ Success alert shows chapter and verse counts
- ✓ Browser console shows parsing details
- ✓ Book appears in the translation selector
- ✓ Verses are readable on the `/read` page

---

**Happy Uploading! 📖**

