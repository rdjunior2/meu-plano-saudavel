import React from 'react';
import { 
  AlertCircle,
  CheckCircle, 
  Clock, 
  FileText, 
  Activity, 
  List, 
  Award, 
  Hourglass,
  ClipboardCheck
} from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const IconAlertCircle: React.FC<IconProps> = (props) => <AlertCircle {...props} />;
export const IconCheck: React.FC<IconProps> = (props) => <CheckCircle {...props} />;
export const IconList: React.FC<IconProps> = (props) => <List {...props} />;
export const IconActivity: React.FC<IconProps> = (props) => <Activity {...props} />;
export const IconClock: React.FC<IconProps> = (props) => <Clock {...props} />;
export const IconFileText: React.FC<IconProps> = (props) => <FileText {...props} />;
export const IconAward: React.FC<IconProps> = (props) => <Award {...props} />;
export const IconHourglass: React.FC<IconProps> = (props) => <Hourglass {...props} />;
export const IconClipboardCheck: React.FC<IconProps> = (props) => <ClipboardCheck {...props} />;

export default {
  IconAlertCircle,
  IconCheck,
  IconList,
  IconActivity,
  IconClock,
  IconFileText,
  IconAward,
  IconHourglass,
  IconClipboardCheck
}; 