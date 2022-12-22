import get from "lodash/get";
import map from "lodash/map";
import React, { useEffect } from "react";
import { denormalize } from "normalizr";
import Helmet from "../../Helmet";
import {
  CircularProgress,
  DropdownMenu,
  FontIcon,
  ListItem,
  MenuButton,
} from "react-md";

import { api, editors } from "../../actions";
import CellList, {largeCellClasses} from "../../CellList";
import * as characters from "../../characters";
import { persorgSchema, statementsSchema } from "../../normalizationSchemas";
import { EditorTypes } from "../../reducers/editors";
import PersorgEntityCard from "../../PersorgEntityCard";
import StatementCard from "../../StatementCard";
import { combineIds, combineSuggestionsKeys } from "../../viewModels";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { RouteComponentProps } from "react-router";
import { EntityId } from "howdju-common";

const id = "persorg-page";
const editorId = "persorgPageEditorId";

interface MatchParams {
  persorgId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

export default function PersorgPage(props: Props) {
  const dispatch = useAppDispatch();
  const persorgId = props.match.params.persorgId;
  useEffect(() => {
    dispatch(api.fetchPersorg(persorgId));
    dispatch(api.fetchSpeakerStatements(persorgId));
  }, [dispatch, persorgId]);

  const entities = useAppSelector((state) => state.entities);
  const persorg = denormalize(persorgId, persorgSchema, entities);
  const { statements: statementIds, isFetching } = useAppSelector(
    (state) => state.persorgPage
  );
  const statements = denormalize(statementIds, statementsSchema, entities);

  const editPersorg = () =>
    dispatch(
      editors.beginEdit(
        EditorTypes.PERSORG,
        combineIds(editorId, "persorg"),
        persorg
      )
    );

  const persorgName = get(persorg, "name", characters.ellipsis);
  const title = `${persorgName}`;

  const statementCards = map(statements, (statement, index) => (
    <StatementCard
      id={combineIds(id, "statements", index)}
      className={largeCellClasses}
      key={index}
      statement={statement}
    />
  ));

  // TODO(17): pass props directly after upgrading react-md to a version with correct types
  const menuClassNameProps = { menuClassName: "context-menu" } as any;
  const menu = (
    <MenuButton
      icon
      id={combineIds(id, "menu")}
      {...menuClassNameProps}
      children={"more_vert"}
      position={DropdownMenu.Positions.TOP_RIGHT}
      menuItems={[
        <ListItem
          primaryText="Edit"
          key="edit"
          leftIcon={<FontIcon>edit</FontIcon>}
          onClick={editPersorg}
        />,
      ]}
    />
  );

  return (
    <div id={id} className="md-grid">
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1 className="md-cell md-cell--12">{title}</h1>
      <PersorgEntityCard
        id={combineIds(id, "persorg")}
        editorId={combineIds(editorId, "persorg")}
        className="md-cell md-cell--12"
        persorg={persorg}
        menu={menu}
        suggestionsKey={combineSuggestionsKeys(id, "persorg")}
      />
      <h2 className="md-cell md-cell--12">Statements</h2>
      {isFetching && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id="tagged-propositions-page--progress" />
        </div>
      )}
      <CellList className="md-grid md-cell md-cell--12 md-grid--card-list--tablet">
        {statementCards}
      </CellList>
    </div>
  );
}
