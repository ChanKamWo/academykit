import DeleteModal from '@components/Ui/DeleteModal';
import EditNameForm from '@components/Ui/EditNameForm';
import { useSection } from '@context/SectionProvider';
import {
  ActionIcon,
  Container,
  createStyles,
  Group,
  Paper,
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import {
  IconChevronRight,
  IconDragDrop,
  IconPencilMinus,
  IconTrashX,
} from '@tabler/icons';
import { CourseStatus } from '@utils/enums';
import errorType from '@utils/services/axiosError';
import {
  ISection,
  useDeleteSection,
  useUpdateSectionName,
} from '@utils/services/courseService';
import { useState } from 'react';
import { DraggableStateSnapshot } from 'react-beautiful-dnd';
import Lessons from './Lessons';
import { useTranslation } from 'react-i18next';

const useStyle = createStyles((theme) => ({
  dragging: {
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.blue : theme.colors.gray[3],
  },
  drop: {
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.blue : theme.colors.gray[4],
  },
}));
const SectionItem = ({
  item,
  slug,
  dragHandleProps,
  snapshot,
  status,
}: {
  item: ISection;
  slug: string;
  dragHandleProps: any;
  snapshot: DraggableStateSnapshot;
  status: CourseStatus;
}) => {
  const { cx, classes } = useStyle();
  const [value, toggle] = useToggle();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const updateSection = useUpdateSectionName(slug);
  const deleteSection = useDeleteSection(slug);
  const section = useSection();
  const { t } = useTranslation();
  const onDelete = async () => {
    try {
      await deleteSection.mutateAsync({
        id: slug,
        sectionId: item.slug,
      });
      showNotification({
        message: t('delete_section_success'),
        title: t('success'),
      });
      toggle();
    } catch (error: any) {
      const err = errorType(error);
      showNotification({
        message: err,
        color: 'red',
        title: t('error'),
      });
      toggle();
    }
  };
  const active = () => section?.activeSection === item.slug;

  return (
    <Paper
      my={30}
      withBorder
      p={10}
      className={cx({
        [classes.dragging]: snapshot.isDragging,
        [classes.drop]: snapshot.isDropAnimating,
      })}
    >
      <DeleteModal
        title={t('sure_want_to_delete')}
        open={value}
        onClose={toggle}
        onConfirm={onDelete}
      />
      <Container
        fluid
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {!isEditing ? (
          <div>
            {item.name}
            <IconPencilMinus
              size={16}
              style={{ marginLeft: '10px', cursor: 'pointer' }}
              onClick={() => {
                setIsEditing(true);
              }}
            />
          </div>
        ) : (
          <EditNameForm
            updateFunction={updateSection}
            item={item}
            slug={slug}
            setIsEditing={setIsEditing}
          />
        )}
        <Group position="right" grow>
          <IconTrashX
            size={18}
            style={{ color: 'red', cursor: 'pointer' }}
            onClick={() => {
              toggle();
            }}
          />
          <IconChevronRight
            size={16}
            onClick={() => {
              section?.setActiveSection(item.slug);
            }}
            style={{
              transform: active() ? 'rotate(90deg)' : '',
              transition: '0.35s',
              cursor: 'pointer',
            }}
          />
          <ActionIcon {...dragHandleProps}>
            <IconDragDrop />
          </ActionIcon>
        </Group>
      </Container>
      {active() && item.lessons && (
        <Lessons
          lessons={item.lessons}
          sectionId={item.slug}
          courseStatus={status}
        />
      )}
    </Paper>
  );
};

export default SectionItem;
