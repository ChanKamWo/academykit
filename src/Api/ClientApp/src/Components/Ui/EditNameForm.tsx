import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import errorType from "@utils/services/axiosError";
import InlineInput from "./InlineInput";
import { useTranslation } from "react-i18next";

const EditNameForm = ({
  item,
  slug,
  setIsEditing,
  updateFunction,
}: {
  item: any;
  slug: string;
  setIsEditing: Function;
  updateFunction: any;
}) => {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      name: item.name,
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        try {
          await updateFunction.mutateAsync({
            id: slug,
            sectionId: item.slug,
            sectionName: values.name,
          });
          showNotification({
            message: t("section_update_success"),
            title: t("successful"),
          });
          setIsEditing(false);
        } catch (error) {
          const err = errorType(error);

          showNotification({
            message: err,
            title: "Error",
            color: "red",
          });
        }
      })}
    >
      <InlineInput
        placeholder={t("section_name_placeholder")}
        onCloseEdit={() => setIsEditing(false)}
        {...form.getInputProps("name")}
      ></InlineInput>
    </form>
  );
};

export default EditNameForm;
