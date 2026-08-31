import React, { useState, useMemo } from 'react';
import { getReviews, getSelectedReview } from '../../services/reviewsService';

import { ReviewMasterSidebar } from './components/ReviewMasterSidebar';
import { ReviewDetailPane } from './components/ReviewDetailPane';

const ReviewsModeration = () => {
  const reviewList = useMemo(() => getReviews(), []);
  const initialSelected = useMemo(() => getSelectedReview(), []);
  
  const [selectedId, setSelectedId] = useState(1);
  // In a real app, this would fetch from the service based on selectedId
  const selectedReview = initialSelected; 

  return (
    <div className="flex-1 flex overflow-hidden gap-4 p-4">
      {/* Left Sidebar – Master List */}
      <ReviewMasterSidebar 
        reviewList={reviewList}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />

      {/* Right Detail Pane */}
      <ReviewDetailPane selectedReview={selectedReview} />
    </div>
  );
};

export default ReviewsModeration;