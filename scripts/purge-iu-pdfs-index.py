#!/usr/bin/env python3
"""Remove IU assignment PDFs from the index (git filter-branch index-filter)."""
import subprocess
import sys

files = [
    "Academic Work.pdf",
    "Guideline_Oral Project Report.pdf",
    "Task_Oral_Project_Report_DLBSEPPSD01_E.pdf",
]
cmd = [
    "git",
    "rm",
    "-rf",
    "--cached",
    "--ignore-unmatch",
    "--",
    *files,
]
# Always succeed so filter-branch continues on commits without those paths
subprocess.run(cmd, check=False)
sys.exit(0)
