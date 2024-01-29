import { Box } from '@mantine/core';
import { FeedbackType } from '@utils/enums';
import { useGetFeedbackGraph } from '@utils/services/feedbackService';
import { useParams } from 'react-router-dom';
import HorizontalBarGraph from './Components/HorizontalBarGraph';
import RatingGraph from './Components/RatingGraph';
import SubjectiveData from './Components/SubjectiveData';

const FeedbackGraphDetail = () => {
  const param = useParams();
  const chartData = useGetFeedbackGraph(param.lessonId as string);

  return (
    <>
      <Box mb={25}>
        {chartData.data?.map((chart, index) => {
          if (chart.type == FeedbackType.Rating) {
            return (
              <RatingGraph
                key={index}
                name={chart.feedbackName}
                stats={chart.rating}
                responseCount={chart.ratingCount}
              />
            );
          } else if (chart.type == FeedbackType.SingleChoice) {
            return (
              <HorizontalBarGraph
                key={index}
                name={chart.feedbackName}
                feedbackOptions={chart.feedbackQuestionOptions}
                responseCount={chart.singleChoiceCount}
                type="SingleChoice"
              />
            );
          } else if (chart.type == FeedbackType.MultipleChoice) {
            return (
              <HorizontalBarGraph
                key={index}
                name={chart.feedbackName}
                feedbackOptions={chart.feedbackQuestionOptions}
                responseCount={chart.multipleChoiceCount}
                type="MultipleChoice"
              />
            );
          } else if (chart.type == FeedbackType.Subjective) {
            return (
              <SubjectiveData
                key={index}
                name={chart.feedbackName}
                answers={chart.subjectiveAnswer}
                responseCount={chart.answerCount}
              />
            );
          }
        })}
      </Box>
    </>
  );
};

export default FeedbackGraphDetail;
