// travel-ai-frontend/src/components/common/SafeDateDisplay.js
import { safeFormatDate } from '../../lib/utils';

const SafeDateDisplay = ({ date, format, fallback = 'Date not available', className = '' }) => {
  return (
    <span className={className}>
      {safeFormatDate(date, fallback)}
    </span>
  );
};

export default SafeDateDisplay;