import os
import subprocess
import tempfile
import webbrowser
from pathlib import Path
from shutil import copyfile

from talon import Module, actions

from .get_list import get_list, get_lists
from .sections.actions import get_actions
from .sections.compound_targets import get_compound_targets
from .sections.scopes import get_scopes

mod = Module()

cheatsheet_out_dir = Path(tempfile.mkdtemp())
cheatsheet_tsv_path: Path = cheatsheet_out_dir / "tsv"
cheatsheet_tsv_path.mkdir(exist_ok=True)

instructions_url = "https://www.cursorless.org/docs/"



@mod.action_class
class Actions:
    def cursorless_cheat_sheet_make_pdf():
        """Show new cursorless html cheat sheet"""
        cheatsheet_out_path = cheatsheet_out_dir / ""
        actions.user.vscode_with_plugin_and_wait(
            "cursorless.showCheatsheet",
            {
                "version": 0,
                "spokenFormInfo": actions.user.cursorless_cheat_sheet_get_json(),
                "outputPath": str(cheatsheet_out_path),
            },
        )
        webbrowser.open(cheatsheet_out_path.as_uri())

    def cursorless_cheat_sheet_get_tsv():
        """Get cursorless cheat sheet as tsv"""
        tex_template = Path(__file__).parent.resolve()/ "templates" / "cheatsheet.tex"

        # print(tex_template)
        cheatsheet_out_path = cheatsheet_out_dir / "curssorless_cheatsheet.tex"
        copyfile(tex_template, cheatsheet_out_path)

        sections = actions.user.cursorless_cheat_sheet_get_json()["sections"]
        for section in sections:
            make_tsv_file(section)
        os.system(f"code {cheatsheet_out_dir}")



        # return example





    def cursorless_cheat_sheet_get_json():
        """Get cursorless cheat sheet json"""
        return {
            "sections": [
                {
                    "name": "Actions",
                    "id": "actions",
                    "items": get_actions(),
                },
                {
                    "name": "Scopes",
                    "id": "scopes",
                    "items": get_scopes(),
                },
                {
                    "name": "Paired delimiters",
                    "id": "pairedDelimiters",
                    "items": get_lists(
                        [
                            "wrapper_only_paired_delimiter",
                            "wrapper_selectable_paired_delimiter",
                            "selectable_only_paired_delimiter",
                        ],
                        "pairedDelimiter",
                    ),
                },
                {
                    "name": "Special marks",
                    "id": "specialMarks",
                    "items": get_list("special_mark", "mark"),
                },
                {
                    "name": "Positions",
                    "id": "positions",
                    "items": get_list("position", "position"),
                },
                {
                    "name": "Compound targets",
                    "id": "compoundTargets",
                    "items": get_compound_targets(),
                },
                {
                    "name": "Colors",
                    "id": "colors",
                    "items": get_list("hat_color", "hatColor"),
                },
                {
                    "name": "Shapes",
                    "id": "shapes",
                    "items": get_list("hat_shape", "hatShape"),
                },
            ]
        }

    def cursorless_open_instructions():
        """Open web page with cursorless instructions"""
        webbrowser.open(instructions_url)


_latex_special_chars = {
        '\\': r'\textbackslash',

    '{': r'\{',
    '}': r'\}',
    '[': r'{[}',
    ']': r'{]}',

    '&': r'\&',
    '%': r'\%',
    '$': r'\$',
    '#': r'\#',
    '_': r'\_',
    '~': r'\textasciitilde{}',
    '^': r'\^{}',
    '\n': '\\newline%\n',
    '-': r'{-}',
    '\xA0': '~',  # Non-breaking space

    '<': r'$<$',
    '>': r'$>$',

}


def latex_escape(text: str) -> str:
    """
    Escape the text so that it can be used in a LaTeX document.
    @param text - the text to be escaped           
    @return the escaped text
    """
    for key,value in  _latex_special_chars.items():
        text = text.replace(key, value)


    return text


def make_tsv_file(dict:dict):

    tsv_file = cheatsheet_tsv_path / f"{dict['id']}.tsv"
    tsv_file.touch

    items = dict['items']

    lines = ["{Spoken Form}\t {Meaning}\n"]

    for item in items:
        for variant in item['variations']:
            lines.append(f"{{{latex_escape(variant['spokenForm'])}}}\t {{{latex_escape(variant['description'])}}}\n")

    with tsv_file.open("w") as f:
        f.writelines(lines)
    
        