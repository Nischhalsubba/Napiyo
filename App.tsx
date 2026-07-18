import { useEffect, useState } from 'react';
import {
  Bookmark,
  Calculator,
  CheckCircle2,
  Code2,
  MapPinned,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import ConvertScreen from './components/ConvertScreen';
import MeasureScreen from './components/MeasureScreen';
import SavedScreen from './components/SavedScreen';
import VisualizeScreen from './components/VisualizeScreen';
import { loadItems, saveItems } from './lib/storage';
import { SavedItem