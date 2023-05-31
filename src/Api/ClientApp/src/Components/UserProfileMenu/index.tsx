import useAuth from "@hooks/useAuth";
import {
  Anchor,
  Avatar,
  Box,
  createStyles,
  Divider,
  Group,
  MantineNumberSize,
  Menu,
  SystemProp,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconLock, IconLogout, IconPencil, IconUser } from "@tabler/icons";
import { UserRole } from "@utils/enums";
import { getInitials } from "@utils/getInitialName";
import { IUser } from "@utils/services/types";
import { CSSProperties, FC, forwardRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  user: IUser;
  size?: MantineNumberSize | undefined;
  direction?: SystemProp<CSSProperties["flexDirection"]>;
};
const useStyle = createStyles({
  item: {
    width: "100%",
  },
});
const UserProfileMenu: FC<Props> = ({
  user: { email, fullName, id, imageUrl, mobileNumber, role },
  size = "md",
}) => {
  const { classes } = useStyle();
  const auth = useAuth();
  const { t } = useTranslation();

  return (
    <Group position="center">
      <Menu
        withArrow
        styles={{
          item: {
            width: "130px",
          },
        }}
      >
        <Menu.Target>
          {auth?.auth && (
            <div>
              <Avatar
                my={3}
                src={imageUrl}
                color="cyan"
                radius={10000}
                size={size}
                sx={{ cursor: "pointer" }}
              >
                {!imageUrl && getInitials(fullName ?? "")}
              </Avatar>
            </div>
          )}
        </Menu.Target>

        <Menu.Dropdown miw={"200px"}>
          <Box sx={{ textAlign: "center" }}>
            <Text size={"xl"} weight="bolder">
              {fullName}
            </Text>
            <Text size={"sm"} color={"dimmed"}>
              {t(`${UserRole[role]}`)}
            </Text>
          </Box>
          <Divider />

          <Menu.Item
            component={Link}
            to={`/userProfile/${id}/certificate`}
            className={classes.item}
            icon={<IconUser size={14} />}
          >
            <Text size={size}>{t("myProfile")}</Text>
          </Menu.Item>
          <Menu.Item
            component={Link}
            to={`/settings`}
            className={classes.item}
            icon={<IconPencil size={14} />}
          >
            <Text size={size}>{t("editProfile")}</Text>
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={`/settings/account`}
            className={classes.item}
            icon={<IconLock size={14} />}
          >
            <Text size={size}>{t("Account")}</Text>
          </Menu.Item>
          <Menu.Item
            onClick={auth?.logout}
            className={classes.item}
            icon={<IconLogout size={14} />}
          >
            <Text size={size}>{t("Logout")}</Text>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
};

export default UserProfileMenu;
