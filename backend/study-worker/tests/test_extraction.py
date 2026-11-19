"""Real PDF parsing/rendering fixtures; no external AI or storage calls."""
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import Mock

from pypdf import PdfWriter
from pypdf.generic import (DecodedStreamObject, DictionaryObject, NameObject, NumberObject)
from PIL import Image, ImageDraw, ImageFont

from study_worker.core import BudgetExceeded, ExtractionError
from study_worker.extraction import Extractor


def pdf_fixture(path, text=None, scanned=False, count=1):
    writer = PdfWriter()
    for _ in range(count):
        page = writer.add_blank_page(612, 792)
        resources, commands = DictionaryObject(), []
        if text:
            font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
            resources[NameObject('/Font')] = DictionaryObject({NameObject('/F1'): writer._add_object(font)})
            commands.append(f'BT /F1 14 Tf 35 750 Td ({text}) Tj ET')
        if scanned:
            image = Image.new('RGB', (1200, 900), 'white')
            font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
            font = ImageFont.truetype(font_path, 38) if Path(font_path).exists() else ImageFont.load_default(size=38)
            draw = ImageDraw.Draw(image)
            for i, line in enumerate(['Operating systems study notes', 'Deadlock requires four conditions.', 'Mutual exclusion and hold and wait.', 'No preemption and circular wait.']):
                draw.text((45, 80 + 110 * i), line, font=font, fill='black')
            stream = DecodedStreamObject()
            stream.set_data(image.tobytes())
            stream.update({NameObject('/Type'): NameObject('/XObject'), NameObject('/Subtype'): NameObject('/Image'), NameObject('/Width'): NumberObject(image.width), NameObject('/Height'): NumberObject(image.height), NameObject('/ColorSpace'): NameObject('/DeviceRGB'), NameObject('/BitsPerComponent'): NumberObject(8)})
            resources[NameObject('/XObject')] = DictionaryObject({NameObject('/Scan'): writer._add_object(stream)})
            commands.append('q 550 0 0 412 30 280 cm /Scan Do Q')
        page[NameObject('/Resources')] = resources
        contents = DecodedStreamObject()
        contents.set_data('\n'.join(commands).encode())
        page[NameObject('/Contents')] = writer._add_object(contents)
    writer.write(path)


class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.path = str(Path(self.folder.name) / 'fixture.pdf')
        self.job = {'document_kind': 'notes', 'contains_handwriting': False, 'owner_id': 'test-owner'}

    def test_selectable_pdf_preserves_text_and_page_number_without_ai(self):
        text = 'Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait. ' * 2
        pdf_fixture(self.path, text=text)
        vision = Mock()
        pages = list(Extractor(vision).extract(self.path, self.job, lambda: None))
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0].number, 1)
        self.assertEqual(pages[0].method, 'native')
        self.assertIn('circular wait', pages[0].text)
        vision.transcribe.assert_not_called()

    def test_selectable_heading_does_not_skip_scanned_body(self):
        pdf_fixture(self.path, text='Unit 1', scanned=True)
        vision = Mock()
        ocr = Mock(return_value=('Unit 1\nDeadlock requires four conditions.', True))
        page = list(Extractor(vision, ocr=ocr).extract(self.path, self.job, lambda: None))[0]
        self.assertIn('Deadlock requires', page.text)
        self.assertEqual(page.text.count('Unit 1'), 1)
        self.assertEqual(page.method, 'native+tesseract')
        self.assertLessEqual(max(ocr.call_args.args[0].size), 1800)
        vision.transcribe.assert_not_called()

    def test_unavailable_handwriting_ocr_does_not_index_local_guesses(self):
        pdf_fixture(self.path, scanned=True)
        vision = Mock()
        vision.transcribe.side_effect = BudgetExceeded('free quota')
        page = list(Extractor(vision, ocr=lambda image: ('An unreliable guess', False)).extract(
            self.path, {**self.job, 'contains_handwriting': True}, lambda: None))[0]
        self.assertEqual(page.quality, 'quota_limited')
        self.assertEqual(page.indexable_text, '')

    def test_page_limit_is_enforced_before_rendering_or_ocr(self):
        pdf_fixture(self.path, count=31)
        with self.assertRaises(ExtractionError):
            list(Extractor(Mock()).extract(self.path, {**self.job, 'document_kind': 'syllabus'}, lambda: None))

    @unittest.skipUnless(shutil.which('tesseract'), 'Tesseract is required for the printed OCR integration test')
    def test_printed_scan_uses_actual_tesseract_without_ai(self):
        pdf_fixture(self.path, scanned=True)
        vision = Mock()
        page = list(Extractor(vision).extract(self.path, self.job, lambda: None))[0]
        self.assertEqual(page.method, 'tesseract')
        self.assertEqual(page.quality, 'good')
        self.assertIn('Deadlock', page.text)
        self.assertIn('circular wait', page.text)
        vision.transcribe.assert_not_called()


if __name__ == '__main__':
    unittest.main()
