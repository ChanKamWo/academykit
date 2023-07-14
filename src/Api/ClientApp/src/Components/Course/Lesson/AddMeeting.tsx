import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Group,
  NumberInput,
  Select,
  Switch,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { useForm, yupResolver } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { LessonType } from "@utils/enums";
import { useActiveZoomLicense } from "@utils/services/adminService";
import errorType from "@utils/services/axiosError";
import {
  useCreateLesson,
  useGetCourseLesson,
  useUpdateLesson,
} from "@utils/services/courseService";
import { ILessonMeeting } from "@utils/services/types";
import moment from "moment";
import { useParams } from "react-router-dom";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import useFormErrorHooks from "@hooks/useFormErrorHooks";
import CustomTextFieldWithAutoFocus from "@components/Ui/CustomTextFieldWithAutoFocus";
import { getDateTime } from "@utils/getDateTime";

const schema = () => {
  const { t } = useTranslation();
  return Yup.object().shape({
    name: Yup.string().required(t("meeting_name_required") as string),
    meetingStartDate: Yup.string()
      .required(t("start_date_required") as string)
      .typeError(t("start_date_required") as string),
    meetingStartTime: Yup.string()
      .required(t("start_time_required") as string)
      .typeError(t("start_time_required") as string),
    meetingDuration: Yup.string()
      .required(t("meeting_duration_required") as string)
      .typeError(t("meeting_duration_required") as string),
    zoomLicenseId: Yup.string().required(t("zoom_license_required") as string),
  });
};

const AddMeeting = ({
  setAddState,
  item,
  isEditing,
  sectionId,
  setAddLessonClick,
  setIsEditing,
}: {
  setAddState: React.Dispatch<React.SetStateAction<string>>;
  item?: ILessonMeeting;
  isEditing?: boolean;
  sectionId?: string;
  setAddLessonClick: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { id: slug } = useParams();
  const lesson = useCreateLesson(slug as string);
  const [dateTime, setDateTime] = useState<string>("");
  const lessonDetails = useGetCourseLesson(
    item?.courseId || "",
    item?.id,
    isEditing
  );
  const { t } = useTranslation();

  // const startDateTime = item?.
  // ? moment(item?.questionSet?.startTime + "z")
  //     .local()
  //     .toDate()
  // : new Date();
  console.log(item);

  const form = useForm({
    initialValues: {
      name: "",
      meetingStartDate: new Date(),
      meetingStartTime: "12:12",
      meetingDuration: 1,
      zoomLicenseId: "",
      isMandatory: false,
      description: "",
    },
    validate: yupResolver(schema()),
  });
  useFormErrorHooks(form);

  const [isMandatory, setIsMandatory] = useState<boolean>(
    item?.isMandatory ?? false
  );

  const updateLesson = useUpdateLesson(
    slug as string,
    item?.courseId,
    item?.id
  );

  useEffect(() => {
    if (lessonDetails.isSuccess && isEditing) {
      const data = lessonDetails.data;
      const startDateTime = moment(data?.meeting?.startDate + "Z")
        .local()
        .toDate();

      form.setValues({
        name: data?.name ?? "",
        meetingDuration: data ? Number(data?.meeting?.duration) / 60 : 0,
        zoomLicenseId: data?.meeting?.zoomLicenseId ?? "",
        meetingStartDate: startDateTime,
        // meetingStartTime: startDateTime.toTimeString(),
        meetingStartTime: moment(startDateTime).format("HH:mm"),
        isMandatory: data?.isMandatory,
        description: data?.description ?? "",
      });
      changeZoomLiscense();
    }
  }, [lessonDetails.isSuccess]);

  useEffect(() => {
    const { meetingDuration, meetingStartTime, meetingStartDate } = form.values;

    if (meetingDuration && meetingStartTime && meetingStartDate) {
      const date = getDateTime(meetingStartDate, meetingStartTime);
      console.log(date);
      setDateTime(() => date.utcDateTime);
    }
  }, [form.values]);

  const meeting = useActiveZoomLicense(
    dateTime,
    form.values.meetingDuration,
    lessonDetails?.data?.id
  );

  const selectItem = meeting.data?.data
    ? meeting.data.data.map((e) => {
        return { value: e.id, label: e.licenseEmail };
      })
    : [
        {
          label: t("select_different_time"),
          value: "null",
          disabled: true,
        },
      ];

  const changeZoomLiscense = () => {
    const { meetingDuration, meetingStartTime, meetingStartDate } = form.values;
    if (meetingDuration && meetingStartTime && meetingStartDate) {
      // const time = new Date(meetingStartTime).toLocaleTimeString();
      // const date = new Date(meetingStartDate).toLocaleDateString();
      console.log("0--0=-0=0-=-0==-00-=");
      console.log({ meetingStartDate, meetingStartTime });
      const date = getDateTime(meetingStartDate, meetingStartTime);
      setDateTime(() => date.utcDateTime);
    } else {
      form.setFieldValue("zoomLicenseId", "");
    }
  };
  const handleSubmit = async (values: any) => {
    // const time = new Date(values?.meetingStartTime).toLocaleTimeString();
    // const date = new Date(values?.meetingStartDate).toLocaleDateString();
    const time = moment(values?.meetingStartTime, "HH:mm").format("HH:mm");
    const date = moment(values?.meetingStartDate, "MM/DD/YYYY").format(
      "MM/DD/YYYY"
    );

    const meeting = {
      ...values,
      meetingStartDate: isEditing
        ? // ? new Date(date + " " + time)
          moment(date + " " + time, "MM/DD/YYYY HH:mm").toDate()
        : new Date(dateTime).toISOString(),
    };

    delete meeting.isMandatory;
    delete meeting.meetingStartTime;

    try {
      if (isEditing) {
        await updateLesson.mutateAsync({
          meeting,
          name: values.name,
          courseId: slug,
          type: LessonType.LiveClass,
          lessonIdentity: item?.id,
          sectionIdentity: sectionId,
          isMandatory: values.isMandatory,
          description: values.description,
        } as ILessonMeeting);
        setIsEditing(false);
      } else {
        await lesson.mutateAsync({
          meeting,
          name: values.name,
          courseId: slug,
          type: LessonType.LiveClass,
          sectionIdentity: sectionId,
          isMandatory: values.isMandatory,
          description: values.description,
        } as ILessonMeeting);
      }
      showNotification({
        message: `${t("capital_lesson")} ${
          isEditing ? t("edited") : t("added")
        } ${t("successfully")}`,
        title: t("success"),
      });
      setAddLessonClick(true);
    } catch (error) {
      const err = errorType(error);
      showNotification({
        message: err,
        color: "red",
        title: t("error"),
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Grid align="center">
        <Grid.Col span={12} lg={6}>
          <CustomTextFieldWithAutoFocus
            label={t("meeting_name")}
            placeholder={t("meeting_name") as string}
            {...form.getInputProps("name")}
            withAsterisk
          />
        </Grid.Col>
        <Tooltip multiline label={t("mandatory_tooltip")} width={220}>
          <Grid.Col span={6} lg={3}>
            <Switch
              label={t("is_mandatory")}
              {...form.getInputProps("isMandatory")}
              checked={isMandatory}
              onChange={() => {
                setIsMandatory(() => !isMandatory);
                form.setFieldValue("isMandatory", !isMandatory);
              }}
            />
          </Grid.Col>
        </Tooltip>
      </Grid>
      <Group grow>
        <DatePickerInput
          valueFormat="MMM DD, YYYY"
          placeholder={t("pick_date") as string}
          label={t("start_date")}
          withAsterisk
          {...form.getInputProps("meetingStartDate")}
        />
        <TimeInput
          label={t("start_time")}
          withAsterisk
          {...form.getInputProps("meetingStartTime")}
        />
      </Group>
      <Group grow mt={5} mb={10}>
        <NumberInput
          label={t("meeting_duration")}
          placeholder={t("meeting_duration_minutes") as string}
          withAsterisk
          min={1}
          {...form.getInputProps("meetingDuration")}
          styles={{ error: { position: "absolute" } }}
        />

        <Select
          onClick={changeZoomLiscense}
          onKeyDown={(e) => {
            if (e.code === "Space") {
              changeZoomLiscense();
            }
          }}
          defaultValue={t("pick_license")}
          label={t("zoom_license")}
          placeholder={t("pick_license") as string}
          disabled={
            !(
              form.values.meetingDuration &&
              form.values.meetingStartDate &&
              form.values.meetingStartTime
            )
          }
          data={selectItem}
          withAsterisk
          {...form.getInputProps("zoomLicenseId")}
          styles={{ error: { position: "absolute" } }}
        />
      </Group>
      <Textarea
        label={t("description")}
        placeholder={t("description_live_class") as string}
        {...form.getInputProps("description")}
      />
      <Group position="left" mt="md">
        <Button
          type="submit"
          loading={lesson.isLoading || updateLesson.isLoading}
        >
          {t("submit")}
        </Button>
        {!isEditing && (
          <Button
            onClick={() => {
              setAddState("");
            }}
            variant="outline"
          >
            {t("close")}
          </Button>
        )}
      </Group>
    </form>
  );
};

export default AddMeeting;
