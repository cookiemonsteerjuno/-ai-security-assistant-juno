Device commands monitor ```
1	import React, { useState, useEffect, useRef } from 'react';
2	import { DeviceCommand, CommandSeverity, CommandExecutionStatus } from '../types';
3	import { audioAnnouncer } from '../services/audioAnnouncer';
...
337	      case 'ELEVATED':
338	        return 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold';
339	      case 'STANDARD':
340	        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 font-semibold';