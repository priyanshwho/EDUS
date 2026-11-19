#!/usr/bin/env python3
"""Rebuild the reviewed UIET 2023–27 catalog from the two supplied PDFs.

Run with the study worker's Python environment (pypdfium2 installed).
Usage: python import-uiet-syllabi.py CSE.pdf IT.pdf [output.json]
PDF text is source data; no model or external service is used.
"""
import hashlib
import json
from pathlib import Path
import re
import sys
import pypdfium2

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/ai/data/catalog/uiet-2023-27.json'


def clean(text):
    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\x02', '-')
    text = re.sub(r'[\x00-\x08\x0b-\x1f]', '', text)
    text = re.sub(r'^\s*(?:Page\s+\d+\s+of\s+\d+|\d+\s*\|\s*P\s*a\s*g\s*e|\d+)\s*\n', '', text, flags=re.I)
    return '\n'.join(line.rstrip() for line in text.splitlines()).strip()


def compact(text):
    return re.sub(r'\s+', ' ', text).strip()


def name_case(text):
    text = compact(text).strip(' .')
    if re.sub(r'\([^)]*\)', '', text).strip().upper() == re.sub(r'\([^)]*\)', '', text).strip():
        text = text.title()
    text = re.sub(r'\(\s*(?:P|Practical)\s*\)', ' (Practical)', text, flags=re.I)
    text = re.sub(r'\s*\(Theory\s*\)', '', text, flags=re.I)
    for word in ['IPR', 'UNIX', 'C++', 'UI']:
        text = re.sub(r'\b' + re.escape(word) + r'\b', word, text, flags=re.I)
    return compact(text)


def sections_for(text, practical, name):
    # Tables of books and outcome mapping are not teaching topics. Do not cut an
    # early RECOMMENDED BOOKS heading: several IT pages put it above the syllabus.
    markers = list(re.finditer(r'\bSECTION\s*[-–:]?\s*([AB])\b[^\n]*', text, re.I))
    if markers:
        # Ignore references to Section A/B inside examiner instructions; actual
        # markers start their own line and contain only column labels afterward.
        markers = [m for m in markers if not text[text.rfind('\n', 0, m.start()) + 1:m.start()].strip()
                   and re.fullmatch(r'\s*(?:CO\s*\(?s\)?|Hrs\.?|Hours|and|&|\s)*', m[0][re.search(r'([AB])\b', m[0]).end():], re.I)]
    result = {'A': [], 'B': []}
    if markers:
        for i, m in enumerate(markers):
            block = text[m.end():markers[i+1].start() if i+1 < len(markers) else len(text)]
            block = teaching_only(block)
            chapters = split_chapters(block, f'Section {m[1].upper()} topics')
            result[m[1].upper()].extend(chapters)
    else:
        start = re.search(r'\n\s*(?:SYLLABUS\b|List of Experiments\b|Practical\s+Oral\s+Communication|Experiment\s*\n)', text, re.I)
        if not start:
            start = re.search(r'\n\s*(?:Module\s*1\b|Unit\s*1\b|SECTION\s*[-–]?\s*A\b)', text, re.I)
        block = text[start.start():] if start else text
        block = teaching_only(block)
        block = re.sub(r'^\s*SYLLABUS\s*', '', block, flags=re.I)
        title = 'Practical syllabus' if practical else 'Course syllabus and requirements'
        if not paragraphs(block):
            # Some course sheets draw the experiment list above their metadata.
            prefix = re.split(r'C?Course\s+Code', text, maxsplit=1, flags=re.I)[0]
            numbered = re.search(r'(?:^|\n)\s*1\.', prefix)
            if numbered:
                block = prefix[numbered.start():]
            else:
                outcomes = re.search(r'On completion of this course.*?(?:able to|able to:)', text, re.I | re.S)
                block = re.split(r'Note\s+for\s+Examiner', text[outcomes.end():] if outcomes else text, maxsplit=1, flags=re.I)[0]
                title = 'Course outcomes (no separate practical list supplied)'
        result['A'] = [{'title': title, 'hours': 0, 'topics': paragraphs(block)}]
    return result


def teaching_only(block):
    # PDF drawing order sometimes places RECOMMENDED BOOKS at the top of a
    # continuation page, before more teaching material. Only the actual book
    # table (or a CSE bibliography/mapping heading) terminates teaching content.
    block = re.sub(r'^\s*RECOMMENDED BOOKS\s*:?[ \t]*$', '', block, flags=re.M | re.I)
    block = re.split(r'\bMapping\s+of\s+Course\s+Outcomes', block, maxsplit=1, flags=re.I)[0]
    return re.split(r'\n\s*(?:Suggested Books|Reference Books|Books Recommended|Mapping of|PO\s*/\s*PS\s*O|CO\s+PO\b|S\s*\.?\s*(?:No\.?|NO\.)\s*(?:NAME|TITLE|BOOK)|Title\s+Author)', block, maxsplit=1, flags=re.I)[0].strip()


def paragraphs(block):
    result, current = [], []
    for raw in block.splitlines():
        line = compact(raw)
        if not line or re.fullmatch(r'(?:CO\(?s\)?|Hours|Hrs\.?|\d+(?:\s*[,/]\s*\d+)*)', line, re.I):
            continue
        if re.fullmatch(r'(?:COURSE INFORMATION SHEET|RECOMMENDED BOOKS)', line, re.I):
            continue
        new_item = re.match(r'^(?:\d+[.)]\s|[•●]\s|Unit\b|Module\s+\d|[A-Z][A-Za-z ]{2,60}:)', line)
        if new_item and current:
            result.append(' '.join(current)); current = []
        current.append(line)
    if current:
        result.append(' '.join(current))
    return result


def split_chapters(block, fallback):
    chapters, pending = [], []

    def finish(hours=0):
        if not pending:
            return
        first = pending[0].rstrip(':')
        prefix = first.split(':')[0]
        title = prefix if ':' in first and 2 < len(prefix) <= 80 else first if len(first) <= 100 else fallback
        body = pending[1:] if title == first and len(pending)>1 else pending[:]
        chapters.append({'title': name_case(title) if title.isupper() else title,
                         'hours': hours, 'topics': paragraphs('\n'.join(body)) or [first]})
        pending.clear()

    for raw in block.splitlines():
        line = compact(raw)
        line = re.sub(r'\s+\d+(?:,\s*\d+)+$', '', line)
        if not line or re.fullmatch(r'(?:CO\(?s\)?|Hours|Hrs\.?|\d+(?:\s*[,/]\s*\d+)+)', line, re.I):
            continue
        standalone = re.fullmatch(r'(\d{1,2})', line)
        inline = re.search(r'\(\s*(\d{1,2})\s*(?:hours?|hrs\.?)?\s*\)\s*(?:\[CO[^]]*\])?\s*$', line, re.I)
        heading = (re.match(r'^(?:Unit\s*[-–:]?\s*\d+|Module\s+\d+)',line,re.I)
                   or line.isupper() and len(line)<100 and len(line.split())>1)
        if heading and pending:
            finish()
        if inline:
            if line[:inline.start()].strip():
                pending.append(line[:inline.start()].strip())
        elif not standalone:
            pending.append(line)
        if (standalone or inline) and pending:
            finish(int((standalone or inline)[1]))
    finish()
    return chapters or [{'title': fallback, 'hours': 0, 'topics': paragraphs(block)}]


def extract(branch, path):
    pdf = pypdfium2.PdfDocument(str(path))
    pages = []
    for page in pdf:
        textpage = page.get_textpage()
        pages.append(clean(textpage.get_text_bounded()))
        textpage.close()
        page.close()
    pdf.close()
    starts = []
    for page_num, page in enumerate(pages, 1):
        if branch == 'CSE':
            for m in re.finditer(r'\bTitle\s+(.+?)\s+Credits?\s+(\d+)\s+Code\s+(.+?)\s+Semester:\s*([1-8])?', page, re.S):
                if page_num < 25:
                    continue
                starts.append({'page': page_num, 'offset': m.start(), 'name': compact(m[1]),
                               'code': compact(m[3]), 'semester': int(m[4]) if m[4] else None,
                               'credits': int(m[2])})
        else:
            codes = list(re.finditer(r'\bC?Course\s+Code\s+([A-Z]+[\s-]*(?:[X1-8]\d\d[a-f]?|01))\b', page, re.I))
            titles = list(re.finditer(r'Course\s+Title\s+(.+?)(?=\s+(?:Type of Course|Course (?:Type|Code|Assessment)|L\s+T\s+P))', page, re.S | re.I))
            for m in codes:
                nearby = [t for t in titles if abs(t.start() - m.start()) < 350]
                if not nearby:
                    raise ValueError(f'Missing title for IT page {page_num}: {m[0]}')
                title = min(nearby, key=lambda t: abs(t.start() - m.start()))
                code = compact(m[1]); num = re.search(r'[1-8]\d\d', code)
                semester = (1 if page_num < 52 else 2) if page_num < 79 else int(num[0][0])
                offset = min(m.start(), title.start())
                header = page.rfind('COURSE INFORMATION SHEET', 0, offset)
                if header >= 0:
                    offset = header
                if offset < 160 and 'SYLLABUS FOR B.E.' in page[:offset]:
                    offset = 0
                starts.append({'page': page_num, 'offset': offset,
                               'name': compact(title[1]), 'code': code, 'semester': semester})
    starts.sort(key=lambda s: (s['page'], s['offset']))
    courses = []
    for i, start in enumerate(starts):
        next_start = starts[i+1] if i+1 < len(starts) else {'page': len(pages)+1, 'offset': 0}
        end_page = next_start['page'] - 1
        if next_start['page'] > start['page']:
            chunks = [pages[start['page']-1][start['offset']:]] + pages[start['page']:end_page]
            if next_start['page'] <= len(pages) and next_start['offset'] > 0:
                prefix = pages[next_start['page']-1][:next_start['offset']].strip()
                if prefix:
                    chunks.append(prefix); end_page = next_start['page']
        else:
            chunks = [pages[start['page']-1][start['offset']:next_start['offset']]]
            end_page = start['page']
        raw = '\n\n'.join(chunks).strip()
        name = name_case(start['name']); code = start['code']; semester = start['semester']; notes = []
        if branch == 'CSE' and start['page'] in {120,130,228}:
            semester = {120:5,130:6,228:8}[start['page']]
            notes.append('Semester follows the teaching scheme; the individual course sheet has a missing or inconsistent semester.')
        if branch == 'IT':
            corrections = {35:('HSMC X51','Professional Communication (Practical)'),
                           124:('PEIT 551c',None),125:('PEIT 501d',None),133:('PWIT 551',None)}
            if start['page'] in corrections:
                code, title = corrections[start['page']];name = title or name
                notes.append('Course identification follows the teaching scheme where the course sheet has an inconsistent code or practical label.')
        practical = bool(re.search(r'practical|\(p\)', name, re.I)) or 'Practical' in raw[:180]
        kind = 'practical' if practical else 'project' if re.search(r'project[-\s]*(?:[IVX]+|\d+)\b', name, re.I) else 'training' if re.search(r'training|innovation',name,re.I) else 'seminar' if name.lower() == 'seminar' else 'theory'
        sections = sections_for(raw, practical, name)
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        for label, chapters in sections.items():
            for n, chapter in enumerate(chapters, 1):
                chapter['chapterId'] = f'{slug}-{label.lower()}-{n}'
        courses.append({'subjectName': name, 'subjectCode': code, 'branch': branch, 'semester': semester,
                        'kind': kind, 'sourcePages': [start['page'], end_page], 'rawText': raw,
                        'sections': sections, 'sourceNotes': notes})
    # Scheme-only entries are retained honestly; no AI-generated syllabus is added.
    extra = [(2,'ST 251','Product Re-engineering and Innovation',12 if branch=='CSE' else 9,'training')]
    if branch == 'IT':
        extra += [(1,'HSMC X01','Professional Communication',7,'theory'),
                  (6,'OEIT 601','Open Elective-I',13,'elective')]
    for semester, code, name, page, kind in extra:
        topics = (['The scheme lists Professional Communication as a theory course (2 credits, L–T–P 2–0–0).',
                   'A separate detailed theory syllabus is not included in the supplied IT PDF.'] if code=='HSMC X01' else
                  ['Choose a course offered by a department of Panjab University, Chandigarh, or a Swayam/NPTEL MOOC.',
                   'The source does not prescribe a single topic syllabus for this open elective.'] if code=='OEIT 601' else
                  ['Mandatory two-week summer training after second-semester examinations.',
                   'Non-credit requirement assessed as satisfactory/unsatisfactory and recorded in the second-semester mark sheet.'])
        slug = re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
        courses.append({'subjectName':name,'subjectCode':code,'branch':branch,'semester':semester,'kind':kind,
                        'sourcePages':[page,page],'rawText':'\n'.join(topics),'schemeOnly':True,
                        'sourceNotes':['Listed in the teaching scheme; no separate detailed course sheet is provided.'],
                        'sections':{'A':[{'chapterId':slug+'-a-1','title':'Teaching scheme information','hours':0,'topics':topics}],'B':[]}})
    return {'filename':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pages':len(pages),'courses':courses}


def main_subjects(courses):
    """Match the scheme's theory-subject rows; alternatives share one elective."""
    rules = {
        'CSE': [
            (1, r'ASPX0[123]', 'Choice-based Physics'),
            (6, r'CS605[A-F]', 'Elective-I'),
            (7, r'CS703[A-F]', 'Elective-II'),
            (7, r'CS704[A-E]', 'Elective-III'),
            (8, r'HSM40[1-6]', 'Elective-IV (Management)'),
            (8, r'CS802[A-E]', 'Elective-V'),
            (8, r'CS803[A-D]', 'Elective-VI'),
        ],
        'IT': [
            (1, r'ASPX0[123]', 'Choice-based Physics'),
            (4, r'HSMC401[A-D]', 'Elective-I (Humanities and Social Sciences)'),
            (5, r'PEIT501[A-F]', 'Professional Elective-I'),
            (6, r'PEIT601[A-D]', 'Professional Elective-II'),
            (6, r'PEIT602[A-D]', 'Professional Elective-III'),
            (7, r'PEIT701[A-D]', 'Professional Elective-IV'),
            (7, r'HSMC701[A-F]', 'Management Elective'),
            (8, r'PEIT801[A-D]', 'Professional Elective-V'),
        ],
    }
    result, groups = [], {}
    for course in courses:
        if course['kind'] not in ['theory', 'elective']:
            continue
        code = re.sub(r'[^A-Z0-9]', '', course['subjectCode'].upper())
        rule = next((r for r in rules[course['branch']] if course['semester']==r[0] and re.fullmatch(r[1],code)), None)
        if not rule:
            result.append(course)
            continue
        groups.setdefault((course['semester'], rule[2]), []).append(course)
    for (semester, name), options in groups.items():
        slug = re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
        sections = {'A': [], 'B': []}
        for label in sections:
            for option in options:
                if not option['sections'][label]:
                    continue
                sections[label].append({
                    'chapterId': f"{slug}-{label.lower()}-{len(sections[label])+1}",
                    'title': f"{option['subjectName']} ({option['subjectCode']})",
                    'hours': sum(chapter['hours'] for chapter in option['sections'][label]),
                    'topics': [chapter['title'] + ': ' + ' '.join(chapter['topics']) for chapter in option['sections'][label]],
                })
        result.append({
            'subjectName': name, 'subjectCode': ' / '.join(option['subjectCode'] for option in options),
            'branch': options[0]['branch'], 'semester': semester, 'kind': 'elective',
            'sourcePages': [min(option['sourcePages'][0] for option in options), max(option['sourcePages'][1] for option in options)],
            'sourceNotes': ['Choose one option from this subject group, as specified in the teaching scheme.'],
            'rawText': '\n\n'.join(option['rawText'] for option in options), 'sections': sections,
            'options': [{'subjectName': option['subjectName'], 'subjectCode': option['subjectCode'], 'sourcePages': option['sourcePages']} for option in options],
        })
    return sorted(result, key=lambda course: (course['semester'],course['subjectName'].lower()))


def main():
    if len(sys.argv) not in (3,4):
        sys.exit(__doc__)
    sources={b:extract(b,Path(p)) for b,p in zip(['CSE','IT'],sys.argv[1:3])}
    for source in sources.values():
        source['courses'] = main_subjects(source['courses'])
    catalog={'institution':'UIET, Panjab University, Chandigarh','batch':'2023–2027','sources':sources}
    output=Path(sys.argv[3]) if len(sys.argv)==4 else OUTPUT
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    for b,source in sources.items():
        print(b,len(source['courses']),'courses', {s:sum(c['semester']==s for c in source['courses']) for s in range(1,9)})


if __name__ == '__main__':
    main()
