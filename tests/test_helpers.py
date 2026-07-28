from app import (
    capitalize_words,
    eval_expr,
    excel_val_to_bool,
    excel_val_to_date_str,
    normalize_url,
    parse_arqueo_fecha,
)


def test_eval_expr_sums_multiple_numbers():
    assert eval_expr('500 + 200 - 50') == 650.0


def test_eval_expr_handles_comma_decimals():
    assert eval_expr('10,5+2,5') == 13.0


def test_eval_expr_empty_or_none_is_zero():
    assert eval_expr(None) == 0.0
    assert eval_expr('') == 0.0
    assert eval_expr('   ') == 0.0


def test_eval_expr_ignores_non_numeric_text():
    assert eval_expr('abc') == 0.0


def test_normalize_url_adds_scheme_when_missing():
    assert normalize_url('example.com') == 'https://example.com'


def test_normalize_url_keeps_existing_scheme():
    assert normalize_url('http://example.com') == 'http://example.com'


def test_normalize_url_empty_stays_empty():
    assert normalize_url('') == ''
    assert normalize_url(None) == ''


def test_capitalize_words():
    assert capitalize_words('juan carlos perez') == 'Juan Carlos Perez'


def test_capitalize_words_empty():
    assert capitalize_words('') == ''


def test_parse_arqueo_fecha_valid():
    assert parse_arqueo_fecha('23/07/2026 14:05') == '2026-07-23T14:05:00.000000'


def test_parse_arqueo_fecha_invalid_returns_none():
    assert parse_arqueo_fecha('not-a-date') is None


def test_excel_val_to_date_str_slash_format():
    assert excel_val_to_date_str('23/07/2026') == '2026-07-23'


def test_excel_val_to_date_str_iso_format():
    assert excel_val_to_date_str('2026-07-23') == '2026-07-23'


def test_excel_val_to_date_str_empty():
    assert excel_val_to_date_str('') == ''
    assert excel_val_to_date_str(None) == ''


def test_excel_val_to_bool():
    assert excel_val_to_bool('Sí') is True
    assert excel_val_to_bool('si') is True
    assert excel_val_to_bool('true') is True
    assert excel_val_to_bool('no') is False
    assert excel_val_to_bool(None) is False
