import Breadcrumb from '@components/Ui/BreadCrumb';
import TextEditor from '@components/Ui/TextEditor';
import ThumbnailEditor from '@components/Ui/ThumbnailEditor';
import {
  Box,
  Button,
  Group,
  Loader,
  MultiSelect,
  Select,
  Text,
} from '@mantine/core';
import { createFormContext, yupResolver } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import queryStringGenerator from '@utils/queryStringGenerator';
import RoutePath from '@utils/routeConstants';
import errorType from '@utils/services/axiosError';
import { useCreateCourse } from '@utils/services/courseService';
import { useAddGroup, useGroups } from '@utils/services/groupService';
import { useLevels } from '@utils/services/levelService';
import { useAddTag, useTags } from '@utils/services/tagService';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Yup from 'yup';
import useFormErrorHooks from '@hooks/useFormErrorHooks';
import useCustomForm from '@hooks/useCustomForm';
import CustomTextFieldWithAutoFocus from '@components/Ui/CustomTextFieldWithAutoFocus';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@utils/enums';

interface FormValues {
  thumbnail: string;
  title: string;
  level: any;
  groups: string;
  description: string;
  tags: string[];
}
const schema = () => {
  const { t } = useTranslation();
  return Yup.object().shape({
    title: Yup.string()
      .trim()
      .required(t('course_title_required') as string)
      .max(100, t('course_title_must_be_less_than_100') as string),
    level: Yup.string().required(t('level_required') as string),
    groups: Yup.string()
      .nullable()
      .required(t('group_required') as string),
  });
};

export const [FormProvider, useFormContext, useForm] =
  createFormContext<FormValues>();

const CreateCoursePage = () => {
  const cForm = useCustomForm();
  const [searchParamGroup] = useState('');
  const { t } = useTranslation();
  const groupAdd = useAddGroup();
  const auth = useAuth();

  const groups = useGroups(
    queryStringGenerator({
      search: searchParamGroup,
      size: 10000,
    })
  );
  const [searchParams] = useSearchParams();
  const groupSlug = searchParams.get('group');
  useEffect(() => {
    if (groups.isSuccess && groups?.data && groupSlug) {
      form.setFieldValue(
        'groups',
        (
          groups.data &&
          groups.data.data.items.find((x) => x.slug === groupSlug)
        )?.id ?? ''
      );
    }
  }, [groups.isSuccess]);

  const form = useForm({
    initialValues: {
      thumbnail: '',
      title: '',
      level: '',
      groups: '',
      description: '',
      tags: [],
    },
    validate: yupResolver(schema()),
  });
  useFormErrorHooks(form);

  const [searchParam] = useState('');

  const label = useLevels();
  const { mutate, data: addTagData, isSuccess } = useAddTag();
  const navigate = useNavigate();

  const tags = useTags(
    queryStringGenerator({
      search: searchParam,
      size: 10000,
    })
  );

  const [tagsList, setTagsList] = useState<{ value: string; label: string }[]>(
    []
  );
  useEffect(() => {
    if (tags.isSuccess && tags.isFetched) {
      setTagsList(tags.data.items.map((x) => ({ label: x.name, value: x.id })));
    }
  }, [tags.isSuccess]);

  useEffect(() => {
    if (isSuccess) {
      setTagsList([
        ...tagsList,
        { label: addTagData.data.name, value: addTagData.data.id },
      ]);
      form.setFieldValue('tags', [...form.values.tags, addTagData?.data?.id]);
    }
  }, [isSuccess]);

  const { mutateAsync, isLoading } = useCreateCourse();
  const submitHandler = async (data: FormValues) => {
    try {
      const res = await mutateAsync({
        description: data.description,
        groupId: data.groups,
        tagIds: data.tags,
        levelId: data.level,
        language: 1,
        name: data.title.trim().split(/ +/).join(' '),
        thumbnailUrl: data.thumbnail,
      });
      form.reset();
      showNotification({
        title: t('success'),
        message: t('create_training_success'),
      });
      navigate(RoutePath.manageCourse.lessons(res.data.slug).route);
    } catch (err) {
      const error = errorType(err);
      showNotification({
        message: error,
        color: 'red',
      });
    }
  };

  return (
    <div>
      <Breadcrumb />
      <FormProvider form={form}>
        <form onSubmit={form.onSubmit(submitHandler)}>
          <Box mt={20}>
            <ThumbnailEditor
              formContext={useFormContext}
              label={t('thumbnail') as string}
            />
            <Group mt={10} grow>
              <CustomTextFieldWithAutoFocus
                placeholder={t('title_course') as string}
                label={t('title')}
                name="Title"
                withAsterisk
                {...form.getInputProps('title')}
                size="lg"
              />
            </Group>

            <Group grow mt={20}>
              {tags.isSuccess ? (
                <MultiSelect
                  searchable
                  creatable
                  sx={{ maxWidth: '500px' }}
                  style={{ marginTop: '3px' }}
                  data={
                    tagsList.length
                      ? tagsList
                      : [
                          {
                            label: t('no_tags') as string,
                            value: 'null',
                            disabled: true,
                          },
                        ]
                  }
                  {...form.getInputProps('tags')}
                  getCreateLabel={(query) => `+ Create ${query}`}
                  onCreate={(query) => {
                    mutate(query);
                    return null;
                  }}
                  size={'lg'}
                  label={t('tags')}
                  placeholder={t('tags_placeholder') as string}
                />
              ) : (
                <div>
                  <Loader />
                </div>
              )}
              {label.isSuccess ? (
                <Select
                  withAsterisk
                  size="lg"
                  placeholder={t('level_placeholder') as string}
                  label={t('level')}
                  {...form.getInputProps('level')}
                  data={
                    label.data.length > 0
                      ? label.data.map((x) => ({ value: x.id, label: x.name }))
                      : [
                          {
                            label: t('no_level') as string,
                            value: 'null',
                            disabled: true,
                          },
                        ]
                  }
                  styles={{ error: { position: 'absolute' } }}
                ></Select>
              ) : (
                <div>
                  <Loader />
                </div>
              )}
            </Group>
            {!groups.isLoading ? (
              <Select
                mt={20}
                description={<Text size={'xs'}>{t('group_create_info')}</Text>}
                searchable
                withAsterisk
                sx={{ maxWidth: '500px' }}
                data={
                  groups?.data?.data?.items?.map((x) => ({
                    label: x.name,
                    value: x.id,
                  })) ?? [
                    {
                      label: t('no_groups') as string,
                      value: 'null',
                      disabled: true,
                    },
                  ]
                }
                {...form.getInputProps('groups')}
                size={'lg'}
                label={t('group')}
                placeholder={t('group_placeholder') as string}
                creatable={
                  // allow for admin and superadmin only
                  auth?.auth?.role == UserRole.SuperAdmin ||
                  auth?.auth?.role == UserRole.Admin
                }
                getCreateLabel={(query) => `+ Create ${query}`}
                onCreate={(value) => {
                  groupAdd
                    .mutateAsync(value)
                    .then((res) => form.setFieldValue('groups', res.data.id)); // setting value after fetch
                  return value;
                }}
              />
            ) : (
              <Loader />
            )}

            <Box mt={20}>
              <Text>{t('description')}</Text>
              <TextEditor
                placeholder={t('course_description') as string}
                formContext={useFormContext}
              />
            </Box>
            <Box mt={20}>
              <Button
                disabled={!cForm?.isReady}
                size="lg"
                type="submit"
                loading={isLoading}
              >
                {t('submit')}
              </Button>
            </Box>
          </Box>
        </form>
      </FormProvider>
    </div>
  );
};

export default CreateCoursePage;
